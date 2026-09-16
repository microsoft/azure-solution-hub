import { load, JSON_SCHEMA } from 'js-yaml';
import { marked } from 'marked';
import data from '../docs/assets/js/workshop-data.js';

export const MANAGED_BY = 'azure-solution-hub/standardize-workshops';

export function frontmatter(text) {
  const match = text.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/);
  if (!match) return { metadata: null, body: text };
  const metadata = load(match[1], { schema: JSON_SCHEMA });
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Frontmatter must be a mapping');
  return { metadata, body: text.slice(match[0].length) };
}

function requireText(value, name) {
  if (typeof value !== 'string' || !value.trim() || /[\r\n]/.test(value)) throw new Error(`Invalid ${name}`);
}

function requireDate(value, name, nullable = false) {
  if (nullable && (value === null || value === '')) return;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error(`Invalid ${name}`);
}

export function validateMetadata(metadata, lab = false) {
  if (!metadata) throw new Error('Missing frontmatter');
  requireText(metadata.title, 'title');
  if (!Number.isInteger(metadata.duration_minutes) || metadata.duration_minutes <= 0) throw new Error('Invalid duration_minutes');
  requireDate(metadata.last_updated, 'last_updated');
  if (lab) return;
  if (metadata.type !== 'workshop') throw new Error('Invalid type');
  requireText(metadata.description, 'description');
  if (!['beginner', 'intermediate', 'advanced'].includes(metadata.level)) throw new Error('Invalid level');
  if (!['active', 'draft', 'archived'].includes(metadata.status)) throw new Error('Invalid status');
  if (!/^[a-z]{2}$/.test(metadata.language || '')) throw new Error('Invalid language');
  for (const field of ['authors', 'contacts', 'tags', 'execution']) {
    if (!Array.isArray(metadata[field]) || !metadata[field].length) throw new Error(`Invalid ${field}`);
    metadata[field].forEach(value => requireText(value, field));
  }
  if (metadata.authors.length !== metadata.contacts.length) throw new Error('authors/contacts length mismatch');
  if (metadata.tags.some(value => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))) throw new Error('Invalid tags');
  if (metadata.execution.some(value => !['codespaces', 'local', 'portal'].includes(value))) throw new Error('Invalid execution');
  requireText(metadata.source, 'source');
  if (!/^(original|localized:\s*\S.*)$/.test(metadata.source)) throw new Error('Invalid source');
  requireDate(metadata.validated_on, 'validated_on', true);
}

function section(tokens, names) {
  const start = tokens.findIndex(token => token.type === 'heading' && token.depth === 2 && names.includes(token.text.trim()));
  if (start < 0) return [];
  let end = start + 1;
  while (end < tokens.length && !(tokens[end].type === 'heading' && tokens[end].depth <= 2)) end++;
  return tokens.slice(start + 1, end);
}

function links(tokens, tablesOnly = false) {
  const result = [];
  marked.walkTokens(tablesOnly ? tokens.filter(token => token.type === 'table') : tokens, token => {
    if (token.type === 'link') result.push({ href: token.href, title: token.text });
  });
  return result;
}

export function repoPath(href, from = 'README.md') {
  const base = new URL(from, 'https://workshop.invalid/');
  const resolved = new URL(href, base);
  if (resolved.origin !== base.origin) throw new Error(`Learning path must use repository-relative links: ${href}`);
  const path = decodeURIComponent(resolved.pathname.slice(1));
  if (path.split('/').some(part => part === '..' || part === '.') || /[\\\r\n]/.test(path)) throw new Error(`Invalid path: ${href}`);
  return path;
}

export async function analyzeStandard({ readme, files, read, repoUrl, ref, sha }) {
  const { metadata, body } = frontmatter(readme);
  validateMetadata(metadata);
  const tokens = marked.lexer(body);
  const pathLinks = links(section(tokens, ['워크샵 학습 경로']), true);
  if (!pathLinks.length) throw new Error('Missing learning path table: ## 워크샵 학습 경로');
  const ordered = pathLinks.map(link => repoPath(link.href));
  if (new Set(ordered).size !== ordered.length) throw new Error('Duplicate labs in learning path');
  if (ordered.some(path => !/^(?:labs\/)?\d{2}-[^/]+\/README\.md$/.test(path))) throw new Error('Labs must link to NN-name/README.md or labs/NN-name/README.md');
  if (new Set(ordered.map(path => path.startsWith('labs/'))).size > 1) throw new Error('Mixed root/labs layouts');
  const rawBase = repoUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/' + sha + '/';
  const rawUrl = path => rawBase + path.split('/').map(encodeURIComponent).join('/');
  const requireFile = path => { if (!files.has(path)) throw new Error(`Missing file: ${path}`); };
  const steps = [];
  for (const path of ordered) {
    requireFile(path);
    const lab = frontmatter(await read(path));
    validateMetadata(lab.metadata, true);
    const labTokens = marked.lexer(lab.body);
    const notebooks = [];
    for (const link of links(labTokens).filter(link => /\.ipynb(?:[?#]|$)/i.test(link.href))) {
      const notebook = repoPath(link.href, path);
      requireFile(notebook);
      if (!notebooks.includes(notebook)) notebooks.push(notebook);
    }
    steps.push({ title: lab.metadata.title, source: rawUrl(path), id: path, duration_minutes: lab.metadata.duration_minutes, notebooks });
    const childLinks = links(section(labTokens, ['학습 단계', '실습 단계']), true).filter(link => /\.md(?:[?#]|$)/i.test(link.href));
    const used = new Set();
    for (const link of childLinks) {
      const child = repoPath(link.href, path);
      if (!child.startsWith(path.slice(0, path.lastIndexOf('/') + 1)) || !/\/\d{2}-[^/]+\.md$/.test(child) || used.has(child)) throw new Error(`Invalid or duplicate split step: ${child}`);
      used.add(child);
      requireFile(child);
      const childDoc = frontmatter(await read(child));
      if (childDoc.metadata) throw new Error(`Split step must not repeat frontmatter: ${child}`);
      const headings = marked.lexer(childDoc.body).filter(token => token.type === 'heading' && token.depth === 1);
      if (headings.length !== 1) throw new Error(`Split step must have one H1: ${child}`);
      steps.push({ title: headings[0].text, source: rawUrl(child), id: child, parent: path, notebooks: [] });
    }
  }
  const overview = section(tokens, ['개요']).map(token => token.raw).join('').trim();
  if (!overview) throw new Error('Missing overview: ## 개요');
  const selected = Object.fromEntries(['type', 'title', 'description', 'level', 'authors', 'contacts', 'duration_minutes', 'tags', 'language', 'execution', 'status', 'source', 'last_updated', 'validated_on'].map(key => [key, metadata[key]]));
  return {
    title: metadata.title,
    overview: `> ${metadata.description}\n\n${overview}`,
    metadata: { schema_version: 2, managed_by: MANAGED_BY, ref, source_commit: sha, overview_source: rawUrl('README.md'), ...selected },
    steps,
  };
}

export function renderStandard({ repoUrl, title, overview, metadata, steps }) {
  const sections = steps.map(step => {
    const { title: stepTitle, source, ...attributes } = step;
    return `## ${stepTitle}\nsource: ${source}\nstep: ${JSON.stringify(attributes)}`;
  });
  return `# ${title}\nrepo: ${repoUrl}\nmetadata: ${JSON.stringify(metadata)}\n\n${overview}\n\n${sections.join('\n\n')}\n`;
}

export const parseManifest = data.parseManifest;