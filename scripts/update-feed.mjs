// @ts-nocheck
/**
 * Azure 서비스 업데이트 RSS를 수집해 최신 항목을 한국어로 번역하고
 * docs/updates/ 아래에 저장합니다.
 *   - updates.json        최신 스냅샷 (사이트 피드 표시용)
 *   - daily/YYYY-MM-DD.json 날짜별 스냅샷 (이력 보관)
 *   - all.json            누적 아카이브 (검색용, 중복 제거)
 *
 * - 번역: MyMemory 무키(no API key) 번역 API. GITHUB_TOKEN 등 별도 키가 필요 없습니다.
 *   (기존 GitHub Models는 2026-07-30 서비스 종료되어 더 이상 사용하지 않습니다.)
 *   선택적으로 MYMEMORY_EMAIL 환경변수를 주면 일일 번역 한도가 상향됩니다.
 * - 실행: GitHub Actions (매일) 또는 로컬(`node scripts/update-feed.mjs`)
 *
 * 번역에 실패해도 원문(영문)으로 폴백하여 항상 유효한 JSON을 생성합니다.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FEED_URL = 'https://www.microsoft.com/releasecommunications/api/v2/azure/rss';
const MAX_ITEMS = 5;

const KNOWN_STATUS = ['Launched', 'In preview', 'In development', 'Retirements'];

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPDATES_DIR = join(__dirname, '..', 'docs', 'updates');
const OUT_PATH = join(UPDATES_DIR, 'updates.json'); // 최신 스냅샷 (사이트 피드 표시용)
const ALL_PATH = join(UPDATES_DIR, 'all.json'); // 누적 아카이브 (검색용)
const DAILY_DIR = join(UPDATES_DIR, 'daily'); // 날짜별 스냅샷

/** 간단한 엔터티 디코딩 (RSS 텍스트용) */
function decode(str) {
  return String(str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '') // 남은 HTML 태그 제거
    .replace(/\s+/g, ' ')
    .trim();
}

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decode(m[1]) : '';
}

function pickAll(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(block)) !== null) out.push(decode(m[1]));
  return out;
}

/** RSS XML → 항목 배열 */
function parseFeed(xml) {
  const items = [];
  const re = /<item\b[\s\S]*?<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[0];
    const rawTitle = pick(block, 'title');
    const link = pick(block, 'link');
    const description = pick(block, 'description');
    const pubDate = pick(block, 'pubDate');
    const categories = pickAll(block, 'category');

    // 상태 배지 (Launched / In preview 등)
    const status = categories.find((c) => KNOWN_STATUS.includes(c)) || '';
    // 제품 영역: 상태가 아닌 첫 카테고리
    const category = categories.find((c) => !KNOWN_STATUS.includes(c)) || '';
    // 제목 앞의 "[Launched]" 같은 접두어 제거
    const title = rawTitle.replace(/^\[[^\]]+\]\s*/, '').trim();

    const date = pubDate ? new Date(pubDate) : null;
    items.push({
      title,
      status,
      category,
      link,
      description,
      date: date && !isNaN(date) ? date.toISOString() : new Date().toISOString(),
    });
  }
  return items;
}

/** MyMemory(무키) 단일 텍스트 번역. 실패/미번역 시 빈 문자열 반환 */
async function mmTranslate(text) {
  const q = String(text || '').slice(0, 480); // MyMemory 세그먼트 길이 제한(~500자)
  if (!q) return '';
  const email = process.env.MYMEMORY_EMAIL || ''; // 있으면 일일 한도 상향
  const url =
    `https://api.mymemory.translated.net/get?langpair=en|ko&q=${encodeURIComponent(q)}` +
    (email ? `&de=${encodeURIComponent(email)}` : '');
  const res = await fetch(url, { headers: { 'User-Agent': 'azure-solution-hub-feed/1.0' } });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const j = await res.json();
  const t = j?.responseData?.translatedText;
  if (!t || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t)) return '';
  return t;
}

/** GitHub Models 실패 시 무키 폴백(MyMemory). 실패 시 null 반환 */
async function translateFree(items) {
  const map = new Map();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    try {
      const titleKo = await mmTranslate(it.title);
      const summaryKo = await mmTranslate((it.description || '').slice(0, 300));
      if (titleKo || summaryKo) map.set(i, { i, titleKo, summaryKo });
    } catch (err) {
      console.warn(`[translate:free] item ${i} failed:`, err.message);
    }
  }
  return map.size ? map : null;
}

async function main() {
  console.log('[feed] fetching', FEED_URL);
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'azure-solution-hub-feed/1.0' },
  });
  if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
  const xml = await res.text();

  const parsed = parseFeed(xml)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_ITEMS);

  console.log(`[feed] parsed ${parsed.length} items`);

  // MyMemory 무키 번역 (기존 GitHub Models는 2026-07-30 종료)
  const translations = await translateFree(parsed);
  const translatedBy = translations ? 'mymemory' : null;
  if (!translations) {
    console.warn('[feed] translation unavailable — falling back to English text');
  }

  const items = parsed.map((it, i) => {
    const t = translations?.get(i);
    return {
      title: it.title,
      titleKo: (t && t.titleKo) || it.title,
      summaryKo: (t && t.summaryKo) || it.description,
      status: it.status,
      category: it.category,
      link: it.link,
      date: it.date,
    };
  });

  const out = {
    generatedAt: new Date().toISOString(),
    source: FEED_URL,
    translated: Boolean(translations),
    translatedBy,
    items,
  };

  await mkdir(UPDATES_DIR, { recursive: true });
  await mkdir(DAILY_DIR, { recursive: true });

  // 1) 최신 스냅샷 (사이트 피드 표시용)
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');

  // 2) 날짜별 스냅샷 저장 (updates/daily/YYYY-MM-DD.json)
  const day = new Date().toISOString().slice(0, 10);
  const dailyPath = join(DAILY_DIR, `${day}.json`);
  await writeFile(dailyPath, JSON.stringify(out, null, 2) + '\n', 'utf8');

  // 3) 누적 아카이브(all.json) 병합 — link 기준 중복 제거, 최신순 정렬
  let existing = [];
  try {
    const prev = JSON.parse(await readFile(ALL_PATH, 'utf8'));
    if (Array.isArray(prev.items)) existing = prev.items;
  } catch {
    /* 최초 실행 — 아카이브 없음 */
  }

  const keyOf = (it) => it.link || `${it.title}|${it.date}`;
  const byKey = new Map();
  for (const it of existing) byKey.set(keyOf(it), it);
  for (const it of items) byKey.set(keyOf(it), it); // 최신 번역본으로 갱신

  const merged = [...byKey.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
  const allOut = {
    generatedAt: new Date().toISOString(),
    source: FEED_URL,
    count: merged.length,
    items: merged,
  };
  await writeFile(ALL_PATH, JSON.stringify(allOut, null, 2) + '\n', 'utf8');

  console.log(
    `[feed] wrote ${OUT_PATH}, ${dailyPath}, ${ALL_PATH} ` +
      `(${items.length} new, ${merged.length} total, translated=${out.translated})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
