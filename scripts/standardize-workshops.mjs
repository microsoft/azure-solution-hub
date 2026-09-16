// @ts-nocheck
/**
 * 공개 워크샵 수집과 사이트 매니페스트 생성
 * ---------------------------------------------------------------------------
 * docs/workshops/workshops.md 에서 `included: true` 로 표시된 워크샵을 찾아,
 * 사이트 공통 단계형(step) 포맷으로 표준화합니다.
 *   1) 표준 리포는 frontmatter와 학습 경로 표를, 기존 리포는 폴더/목차를 분석
 *   2) docs/workshops/<slug>/index.md 를 생성 (개요 + 단계, 첫 단계는 개요)
 *   3) workshops.md 항목에 `folder: <slug>` 연결
 *   4) catalog.json, sitemap.xml, llms.txt 에 메타데이터와 뷰어 URL 반영
 *
 * 자동 생성 표시가 있는 표준 매니페스트만 갱신하며 수동 매니페스트는 보호합니다.
 * 모든 수집/검사가 성공한 뒤에만 파일을 기록합니다.
 *
 * 실행: GitHub Actions(workshops.md 변경 시) 또는 로컬 `node scripts/standardize-workshops.mjs`
 * 상세 규칙은 .github/skills/workshop-standardization/SKILL.md 를 참고하세요.
 */

import { writeFile, readFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { analyzeStandard, frontmatter, MANAGED_BY, parseManifest, renderStandard } from './workshop-standard.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HOST = 'https://microsoft.github.io/azure-solution-hub';

const GH_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'azure-solution-hub-standardizer',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

const exists = (p) => access(p).then(() => true).catch(() => false);
const today = () => new Date().toISOString().slice(0, 10);

/** 레포 URL 에서 owner/repo 추출 */
function repoOf(url) {
  const m = String(url).match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

/** kebab-case 슬러그 */
function slugify(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/** URL 경로 인코딩 (세그먼트별) */
function encodePath(p) {
  return p.split('/').map(encodeURIComponent).join('/');
}

/** workshops.md 파싱 → included 항목 목록 */
export function parseIncluded(text) {
  const lines = text.replace(/<!--[\s\S]*?-->/g, comment => comment.replace(/[^\r\n]/g, '')).split(/\r?\n/);
  const items = [];
  let cur = null;
  const flush = () => { if (cur) items.push(cur); cur = null; };
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (line.startsWith('### ')) {
      flush();
      let title = line.slice(4).trim().replace(/\s*\([^)]*\)\s*$/, '');
      cur = { title, headerLine: i, included: false, folder: '', repo: '', ref: '', lastLine: i };
      continue;
    }
    if (!cur) continue;
    if (line.startsWith('## ') || line.startsWith('<!--')) { flush(); continue; }
    cur.lastLine = i;
    if (/^included\s*:/i.test(line)) { cur.included = /^(true|yes|1)$/i.test(line.split(':')[1].trim()); continue; }
    const fm = line.match(/^folder\s*:\s*([A-Za-z0-9_-]+)/i);
    if (fm) { cur.folder = fm[1]; continue; }
    const ref = line.match(/^ref\s*:\s*(\S+)$/i);
    if (ref) { cur.ref = ref[1]; continue; }
    const gh = line.match(/https?:\/\/github\.com\/[^\s)\]]+/i);
    if (gh && !cur.repo) cur.repo = gh[0];
  }
  flush();
  return items.filter((w) => w.included && w.repo);
}

/** README 하단 Contents 목록(표시명) 순서 추출 */
export function parseContentsOrder(readme) {
  const m = readme.match(/^#{1,6}\s*Contents\s*$([\s\S]*?)(?:^#{1,6}\s|(?![\s\S]))/im);
  if (!m) return [];
  const names = [];
  for (const l of m[1].split(/\r?\n/)) {
    const t = l.replace(/<br\s*\/?>/gi, '').trim();
    const mm = t.match(/^(?:\d+[.)]\s*|[-*]\s*)(.+)$/);
    if (mm) names.push(mm[1].trim());
  }
  return names;
}

/** README 에서 개요(제목 다음 ~ 첫 '## ' 이전) 추출 */
function parseOverview(readme) {
  const noComments = readme.replace(/<!--[\s\S]*?-->/g, '');
  const lines = noComments.split(/\r?\n/);
  let title = '';
  const body = [];
  let started = false;
  for (const l of lines) {
    const t = l.trim();
    if (!title && /^#\s+/.test(t)) { title = t.replace(/^#\s+/, '').trim(); started = true; continue; }
    if (!started) continue;
    if (/^#{2,6}\s+/.test(t)) break; // 첫 하위 섹션에서 개요 종료
    body.push(l);
  }
  const clean = body
    .filter((l) => !/^!\[/.test(l.trim())) // 이미지 라인 제외
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { title, overview: clean };
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

/** 레포 구조 분석 → { title, overview, steps:[{title, source, desc}] } */
export async function analyzeRepo(owner, repo, { ref, fetcher = fetch, standardOnly = false } = {}) {
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  const request = async (url, json = false) => {
    const response = await fetcher(url, { headers: json ? GH_HEADERS : {}, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return json ? response.json() : response.text();
  };
  const meta = await request(apiBase, true);
  if (meta.private !== false || meta.visibility !== 'public') throw new Error(`공개 리포만 등재할 수 있습니다: ${owner}/${repo}`);
  const branch = ref || meta.default_branch;
  const commit = await request(`${apiBase}/commits/${encodeURIComponent(branch)}`, true);
  if (!/^[a-f0-9]{40}$/.test(commit.sha)) throw new Error('Invalid source commit');
  const tree = await request(`${apiBase}/git/trees/${commit.sha}?recursive=1`, true);
  if (tree.truncated || !Array.isArray(tree.tree)) throw new Error(`불완전한 레포 트리: ${owner}/${repo}`);
  const files = new Set(tree.tree.filter(entry => entry.type === 'blob').map(entry => entry.path));
  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${commit.sha}`;
  const read = path => request(`${rawBase}/${encodePath(path)}`);
  const readme = await read('README.md');
  const document = frontmatter(readme);
  if (document.metadata?.type === 'workshop') {
    return analyzeStandard({ readme, files, read, repoUrl: `https://github.com/${owner}/${repo}`, ref: branch, sha: commit.sha });
  }
  if (standardOnly) throw new Error('표준 리포의 type: workshop 또는 frontmatter가 제거되었습니다.');
  const { title: readmeTitle, overview } = parseOverview(readme);
  const title = readmeTitle || repo;

  const blobs = tree.tree.filter((n) => n.type === 'blob');
  const dirsWithReadme = [
    ...new Set(
      blobs
        .filter((n) => /^[^/]+\/README\.md$/i.test(n.path))
        .map((n) => n.path.split('/')[0])
    ),
  ];

  let steps = [];

  if (dirsWithReadme.length >= 1) {
    // 유형 A: 단계 폴더
    const leadNum = (s) => { const m = s.match(/^\s*(\d+)/); return m ? parseInt(m[1], 10) : 999; };
    dirsWithReadme.sort((a, b) => leadNum(a) - leadNum(b) || a.localeCompare(b));
    steps = dirsWithReadme.map((d) => ({
      title: d.replace(/^\s*\d+[.)]\s*/, (m) => m).trim(),
      source: `${rawBase}/${encodePath(d)}/README.md`,
      desc: '',
    }));
  } else {
    // 유형 B: 루트 단계 .md 파일
    const rootMd = blobs
      .map((n) => n.path)
      .filter((p) => /^[^/]+\.md$/i.test(p) && !/^readme\.md$/i.test(p));
    const order = parseContentsOrder(readme);
    const ordered = [];
    const used = new Set();
    for (const name of order) {
      const hit = rootMd.find((p) => !used.has(p) && norm(p.replace(/\.md$/i, '')).includes(norm(name)));
      if (hit) { ordered.push(hit); used.add(hit); }
    }
    for (const p of rootMd) if (!used.has(p)) ordered.push(p);
    steps = ordered.map((p) => ({
      title: p.replace(/\.md$/i, ''),
      source: `${rawBase}/${encodePath(p)}`,
      desc: '',
    }));
  }

  return { title, overview, steps };
}

/** index.md 매니페스트 텍스트 생성 (baseline) */
function renderManifest({ repoUrl, title, overview, steps }) {
  const head = [
    '<!-- 자동 생성(baseline). 개요/단계 설명은 필요 시 다듬으세요. 형식: workshops/_template/index.md -->',
    '',
    `# ${title}`,
    `repo: ${repoUrl}`,
    '',
    overview ? overview : '> 이 워크샵의 개요입니다.',
    '',
    '### 진행 방법',
    '',
    '왼쪽의 **실습 단계**를 순서대로 선택하며 진행합니다. 각 단계의 상세 지침과 화면은 원본 저장소에서 실시간으로 불러옵니다.',
    '',
  ].join('\n');
  const body = steps
    .map((s, i) => `## ${i + 1}. ${s.title}\nsource: ${s.source}${s.desc ? `\n${s.desc}` : ''}`)
    .join('\n\n');
  return `${head}\n${body}\n`;
}

/** workshops.md 항목에 folder 줄 추가 (없을 때) */
export function ensureFolderLine(text, item, slug) {
  if (item.folder) return text;
  const lines = text.split(/\r?\n/);
  // included 줄 바로 다음에 삽입, 없으면 헤더 다음
  let insertAt = item.headerLine + 1;
  for (let i = item.headerLine + 1; i <= item.lastLine; i++) {
    if (/^\s*included\s*:/i.test(lines[i])) { insertAt = i + 1; break; }
  }
  lines.splice(insertAt, 0, `folder: ${slug}`);
  return lines.join('\n');
}

/** sitemap.xml 에 뷰어 URL 추가 (없을 때) */
export function ensureSitemap(xml, slug, changed = false) {
  const loc = slug ? `${HOST}/workshop.html?slug=${slug}` : `${HOST}/`;
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const root = document.documentElement;
  if (root.localName !== 'urlset') throw new Error('Invalid sitemap.xml');
  let entry = Array.from(root.getElementsByTagName('url')).find(node => node.getElementsByTagName('loc')[0]?.textContent === loc);
  if (entry && !changed) return xml;
  const append = (parent, name, value) => {
    const node = document.createElementNS(root.namespaceURI, name);
    node.textContent = value;
    parent.appendChild(document.createTextNode('\n    '));
    parent.appendChild(node);
  };
  if (entry) {
    const lastmod = entry.getElementsByTagName('lastmod')[0];
    if (lastmod) lastmod.textContent = today();
    else append(entry, 'lastmod', today());
  } else {
    entry = document.createElementNS(root.namespaceURI, 'url');
    append(entry, 'loc', loc);
    append(entry, 'lastmod', today());
    append(entry, 'changefreq', 'monthly');
    append(entry, 'priority', '0.7');
    entry.appendChild(document.createTextNode('\n  '));
    root.appendChild(document.createTextNode('  '));
    root.appendChild(entry);
    root.appendChild(document.createTextNode('\n'));
  }
  return new XMLSerializer().serializeToString(document);
}

/** llms.txt 에 뷰어 링크 추가 (없을 때) */
function ensureLlms(txt, slug, title, description = '') {
  const url = `${HOST}/workshop.html?slug=${slug}`;
  const line = `- [${title.replace(/[\[\]]/g, '')}](${url}): ${description || '단계별 실습 워크샵.'}`;
  if (txt.includes(url)) return description ? txt.split('\n').map(existing => existing.includes(`](${url})`) ? line : existing).join('\n') : txt;
  if (/##\s*Hands-on Workshops/i.test(txt)) {
    return txt.replace(/(##\s*Hands-on Workshops[^\n]*\n)/i, `$1${line}\n`);
  }
  return `${txt.trimEnd()}\n\n## Hands-on Workshops\n\n${line}\n`;
}

export async function main({ root = ROOT, fetcher = fetch } = {}) {
  const docs = join(root, 'docs');
  const workshopsPath = join(docs, 'workshops', 'workshops.md');
  const sitemapPath = join(docs, 'sitemap.xml');
  const llmsPath = join(docs, 'llms.txt');
  let wsText = await readFile(workshopsPath, 'utf8');
  const items = parseIncluded(wsText);
  let sitemap = await readFile(sitemapPath, 'utf8');
  let llms = await readFile(llmsPath, 'utf8');
  const writes = new Map();
  const catalog = [];
  const folders = new Set();
  const connections = [];
  for (const item of items) {
    const info = repoOf(item.repo);
    if (!info) throw new Error(`레포 URL 파싱 실패: ${item.title}`);
    const slug = item.folder || slugify(info.repo);
    if (folders.has(slug)) throw new Error(`중복 folder: ${slug}`);
    folders.add(slug);
    const dir = join(docs, 'workshops', slug);
    const manifestPath = join(dir, 'index.md');
    const existing = await exists(manifestPath) ? await readFile(manifestPath, 'utf8') : '';
    const previous = existing ? parseManifest(existing) : null;
    let manifest = existing;
    let model = previous;
    if (previous && previous.metadata?.managed_by !== MANAGED_BY) {
      console.log(`유지: ${slug} (수동 매니페스트)`);
    } else {
      console.log(`수집: ${slug} ← ${info.owner}/${info.repo}`);
      const analyzed = await analyzeRepo(info.owner, info.repo, { ref: item.ref, fetcher, standardOnly: !!previous });
      const repoUrl = `https://github.com/${info.owner}/${info.repo}`;
      manifest = analyzed.metadata ? renderStandard({ repoUrl, ...analyzed }) : renderManifest({ repoUrl, ...analyzed });
      model = parseManifest(manifest);
      writes.set(manifestPath, manifest);
    }
    connections.push({ item, slug });
    if (model.metadata) catalog.push({ slug, repo: model.repo, metadata: model.metadata });
    sitemap = ensureSitemap(sitemap, slug, manifest !== existing);
    llms = ensureLlms(llms, slug, model.title || item.title, model.metadata?.description);
  }
  for (const { item, slug } of connections.reverse()) wsText = ensureFolderLine(wsText, item, slug);
  const catalogPath = join(docs, 'workshops', 'catalog.json');
  const catalogText = JSON.stringify({ schema_version: 1, workshops: catalog }, null, 2) + '\n';
  const previousCatalog = await exists(catalogPath) ? await readFile(catalogPath, 'utf8') : '';
  if (catalogText !== previousCatalog) sitemap = ensureSitemap(sitemap, null, true);
  writes.set(workshopsPath, wsText);
  writes.set(sitemapPath, sitemap);
  writes.set(llmsPath, llms);
  writes.set(catalogPath, catalogText);
  for (const [path, content] of writes) {
    if (await exists(path) && await readFile(path, 'utf8') === content) continue;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf8');
  }
  console.log('완료.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
