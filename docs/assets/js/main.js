// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('mainNav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Close menu when a link is clicked (mobile)
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Reveal-on-scroll animation
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

// Current year in footer
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/* ============================================================
   Hero 통계 카운터
   실제 콘텐츠 개수를 10단위로 올림하여 "N+" 형식으로 표시합니다.
   (예: 솔루션 6개 → "10+", 워크샵 16개 → "20+")
   ============================================================ */
function setRoundedStat(id, count) {
  const el = document.getElementById(id);
  if (!el || !Number.isFinite(count) || count <= 0) return;
  const rounded = Math.max(10, Math.ceil(count / 10) * 10);
  el.textContent = rounded + '+';
}

/* ============================================================
   Dynamic solutions
   solutions/solutions.md 매니페스트를 읽어 솔루션 카드를 렌더링합니다.
   각 카드는 solution.html?slug=<slug> 상세 페이지로 연결됩니다.
   ============================================================ */
(function initSolutions() {
  const grid = document.getElementById('solutionGrid');
  if (!grid) return;

  const nav = document.getElementById('solutionNav');
  const source = grid.getAttribute('data-source') || 'solutions/solutions.md';

  const esc = (str) =>
    String(str || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  // 아이콘 키 → SVG 내부 경로 (메인 카드용)
  const ICONS = {
    cloud: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4"/><path d="M3 17l9 4 9-4"/>',
    ai: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M17 7l2-2M5 19l2-2"/>',
    security: '<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/>',
    data: '<path d="M4 5h16v14H4z"/><path d="M4 9h16M9 19V9"/>',
    modernwork: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    app: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  };

  // 'YYYY-MM-DD' 또는 'YYYY-MM-DD HH:mm' (내부 기록은 시간까지 포함) → Date
  function parseDate(s) {
    if (!s) return null;
    const d = new Date(s.trim().replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }
  // 카드 표시는 날짜만 (YYYY.MM.DD)
  function fmtDate(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  }

  // 매니페스트 파싱: '### 제목' + slug/tag/icon/url/category/date + workshop(최대 2) + 요약
  function parse(text) {
    const cleaned = text.replace(/<!--[\s\S]*?-->/g, '');
    const items = [];
    let cur = null;
    cleaned.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line || line.startsWith('#') && !line.startsWith('###')) return;
      if (line.startsWith('### ')) {
        cur = { title: line.slice(4).trim(), slug: '', tag: '', icon: 'cloud', summary: '', category: '', date: '', url: '', workshops: [] };
        items.push(cur);
        return;
      }
      if (!cur) return;
      // 관련 워크샵: 'workshop: 라벨 | https://...' (라벨 생략 시 URL 사용). 최대 2개.
      const ws = line.match(/^workshop\s*:\s*(.+)$/i);
      if (ws) {
        const parts = ws[1].split('|');
        const url = (parts[1] || parts[0]).trim();
        const label = (parts.length > 1 ? parts[0] : '').trim();
        if (/^https?:\/\//i.test(url) && cur.workshops.length < 2) {
          cur.workshops.push({ label: label || url, url });
        }
        return;
      }
      const meta = line.match(/^(slug|tag|icon|url|category|date)\s*:\s*(.+)$/i);
      if (meta) {
        cur[meta[1].toLowerCase()] = meta[2].trim();
      } else {
        cur.summary += (cur.summary ? ' ' : '') + line;
      }
    });
    return items.filter((it) => it.slug || it.url);
  }

  // 가로형(한 행에 하나) 솔루션 카드
  function renderCard(it, isNewest) {
    const icon = ICONS[it.icon] || ICONS.cloud;
    const isUrl = !!it.url && /^https?:\/\//i.test(it.url);
    const slug = (it.slug || '').replace(/[^A-Za-z0-9_-]/g, '');
    const href = isUrl ? it.url : `solution.html?slug=${encodeURIComponent(slug)}`;
    const detailAttrs = isUrl ? ' target="_blank" rel="noopener"' : '';
    const dateHtml = it._date ? `<span class="card-date">업데이트 ${esc(fmtDate(it._date))}</span>` : '';
    const newBadge = isNewest ? '<span class="badge-new">최신</span>' : '';
    const wsHtml = it.workshops && it.workshops.length
      ? `<div class="srow-workshops">
            <span class="sw-label">워크샵 바로가기</span>
            ${it.workshops
              .map(
                (w) =>
                  `<a class="sw-link" href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.label)} <span class="arrow">↗</span></a>`
              )
              .join('')}
          </div>`
      : '';
    return `
      <article class="card solution-row reveal visible">
        <div class="srow-main">
          <div class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${icon}</svg>
          </div>
          <div class="srow-body">
            <div class="card-tags">
              <span class="tag solution">${esc(it.tag)}</span>
              ${newBadge}
              ${dateHtml}
            </div>
            <h3>${esc(it.title)}</h3>
            <p>${esc(it.summary)}</p>
          </div>
        </div>
        <div class="srow-actions">
          <a class="btn-detail" href="${esc(href)}"${detailAttrs}>자세히 보기 <span class="arrow">→</span></a>
          ${wsHtml}
        </div>
      </article>`;
  }

  // ---- 상태 & 뷰 렌더링 (카테고리 필터 + 페이지네이션) ----
  const PAGE_SIZE = 3; // 한 화면 최대 3행
  let allItems = [];
  let groups = new Map();
  let cats = [];
  let newest = null;
  let curCat = '__all';
  let curPage = 1;

  function listFor(cat) {
    if (cat === '__all') {
      return [...allItems].sort(
        (a, b) => (b._date ? b._date.getTime() : 0) - (a._date ? a._date.getTime() : 0)
      );
    }
    return groups.get(cat) || [];
  }

  function renderPager(totalPages) {
    let btns = '';
    for (let i = 1; i <= totalPages; i++) {
      btns += `<button class="page-btn${i === curPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    }
    return `
      <nav class="pagination" aria-label="페이지 네비게이션">
        <button class="page-btn nav-prev" data-page="${curPage - 1}"${curPage === 1 ? ' disabled' : ''}>← 이전</button>
        ${btns}
        <button class="page-btn nav-next" data-page="${curPage + 1}"${curPage === totalPages ? ' disabled' : ''}>다음 →</button>
      </nav>`;
  }

  function renderView() {
    const list = listFor(curCat);
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (curPage > totalPages) curPage = totalPages;
    const start = (curPage - 1) * PAGE_SIZE;
    const pageItems = list.slice(start, start + PAGE_SIZE);
    const title = curCat === '__all' ? '전체' : curCat;

    grid.innerHTML = `
      <section class="cat-group">
        <h3 class="cat-title">${esc(title)} <span class="cat-count">${list.length}</span></h3>
        <div class="solution-rows">${pageItems.map((it) => renderCard(it, it === newest)).join('')}</div>
        ${totalPages > 1 ? renderPager(totalPages) : ''}
      </section>`;
  }

  fetch(source, { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => {
      allItems = parse(text);
      if (!allItems.length) {
        grid.innerHTML = '<div class="workshop-loading">등록된 솔루션이 없습니다.</div>';
        if (nav) nav.innerHTML = '';
        return;
      }

      // 내부 기록(시간 포함)으로 최신 항목 판별
      allItems.forEach((it) => { it._date = parseDate(it.date); });
      newest = null;
      allItems.forEach((it) => {
        if (it._date && (!newest || it._date > newest._date)) newest = it;
      });

      // 카테고리별 그룹화 (category 없으면 tag로 대체)
      groups = new Map();
      allItems.forEach((it) => {
        const cat = (it.category || it.tag || '기타').trim();
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat).push(it);
      });
      groups.forEach((arr) =>
        arr.sort((a, b) => (b._date ? b._date.getTime() : 0) - (a._date ? a._date.getTime() : 0))
      );
      cats = [...groups.keys()];

      // 왼쪽: 카테고리 네비게이션
      if (nav) {
        nav.innerHTML =
          `<button class="cat-item active" data-cat="__all">전체 <span class="count">${allItems.length}</span></button>` +
          cats
            .map(
              (c) =>
                `<button class="cat-item" data-cat="${esc(c)}">${esc(c)} <span class="count">${groups.get(c).length}</span></button>`
            )
            .join('');
        nav.addEventListener('click', (e) => {
          const btn = e.target.closest('.cat-item');
          if (!btn) return;
          nav.querySelectorAll('.cat-item').forEach((b) => b.classList.toggle('active', b === btn));
          curCat = btn.getAttribute('data-cat');
          curPage = 1;
          renderView();
        });
      }

      // 페이지네이션 클릭 (이벤트 위임)
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (!btn || btn.disabled) return;
        const p = parseInt(btn.getAttribute('data-page'), 10);
        if (!p || p === curPage) return;
        curPage = p;
        renderView();
        const head = document.getElementById('solutions');
        if (head) head.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      renderView();
      setRoundedStat('statSolutions', allItems.length);
    })
    .catch(() => {
      grid.innerHTML = '<div class="workshop-loading">솔루션 목록을 불러오지 못했습니다.</div>';
      if (nav) nav.innerHTML = '';
    });
})();

/* ============================================================
   Dynamic "What's New" feed
   GitHub Actions가 매일 Azure 서비스 업데이트 RSS를 수집·번역해
   생성하는 updates.json 을 읽어 신규 기능 카드로 렌더링합니다.
   ============================================================ */
(function initUpdates() {
  const list = document.getElementById('featureList');
  if (!list) return;

  const source = list.getAttribute('data-source') || 'updates/updates.json';

  const esc = (str) =>
    String(str || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  // RSS 상태(category) → 배지 라벨/스타일 매핑
  const STATUS = {
    'Launched': { label: '출시', cls: 'new' },
    'In preview': { label: '미리보기', cls: 'update' },
    'In development': { label: '개발 중', cls: 'update' },
    'Retirements': { label: '지원 종료', cls: 'update' },
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return esc(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  };

  function renderItem(it) {
    const st = STATUS[it.status] || { label: '업데이트', cls: 'update' };
    const title = esc(it.titleKo || it.title);
    const summary = esc(it.summaryKo || '');
    const area = it.category ? `<span class="fi-area">${esc(it.category)}</span>` : '';
    const link = /^https?:\/\//i.test(it.link || '') ? it.link : '#';
    return `
      <div class="feature-item reveal visible">
        <div class="date">${fmtDate(it.date)}</div>
        <div class="fi-main">
          <div class="fi-meta">
            <span class="tag ${st.cls}">${st.label}</span>${area}
          </div>
          <h3>${title}</h3>
          <p>${summary}</p>
        </div>
        <div class="fi-cta"><a class="card-link" href="${esc(link)}" target="_blank" rel="noopener">릴리스 노트 <span class="arrow">→</span></a></div>
      </div>`;
  }

  fetch(source, { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        list.innerHTML = '<div class="workshop-loading">표시할 업데이트가 없습니다.</div>';
        return;
      }
      list.innerHTML = items.map(renderItem).join('');
    })
    .catch(() => {
      list.innerHTML = '<div class="workshop-loading">업데이트 소식을 불러오지 못했습니다.</div>';
    });
})();

/* ============================================================
   Dynamic workshops
   workshops.md 파일을 읽어 카테고리 > 워크샵 구조로 파싱하고,
   설명이 없는 워크샵은 GitHub API 설명으로 보완하여 렌더링합니다.
   ============================================================ */
(function initWorkshops() {
  const container = document.getElementById('workshopContainer');
  if (!container) return;

  const nav = document.getElementById('workshopNav');
  const source = container.getAttribute('data-source') || 'workshops/workshops.md';

  const escapeHtml = (str) =>
    String(str || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const repoOf = (url) => {
    const m = url.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i);
    return m ? { owner: m[1], repo: m[2].replace(/\.git$/, '') } : null;
  };

  // 목록 파일 텍스트를 [{ name, workshops: [...] }] 구조로 파싱
  function parse(text) {
    const cleaned = text.replace(/<!--[\s\S]*?-->/g, '');
    const categories = [];
    let cat = null;
    let ws = null;

    const flushWs = () => {
      if (ws && cat) cat.workshops.push(ws);
      ws = null;
    };
    const flushCat = () => {
      flushWs();
      if (cat && cat.workshops.length) categories.push(cat);
      cat = null;
    };

    cleaned.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line) return;

      // 카테고리
      if (line.startsWith('## ')) {
        flushCat();
        cat = { name: line.slice(3).trim(), workshops: [] };
        return;
      }
      // 워크샵 제목
      if (line.startsWith('### ')) {
        flushWs();
        if (!cat) cat = { name: '워크샵', workshops: [] };
        let title = line.slice(4).trim();
        const badges = [];
        const paren = title.match(/\(([^)]*)\)\s*$/);
        if (paren) {
          title = title.slice(0, paren.index).trim();
          paren[1].split('/').map((s) => s.trim()).filter(Boolean).forEach((b) => badges.push(b));
        }
        ws = { title, badges, description: '', links: [], folder: '' };
        return;
      }
      // 다른 주석 줄 무시
      if (line.startsWith('#')) return;

      // 표준화 대상 표시(빌드/에이전트용 메타). 렌더링에는 영향 없음.
      const inc = line.match(/^included\s*:\s*(.+)$/i);
      if (inc) {
        if (ws) ws.included = /^(true|yes|1)$/i.test(inc[1].trim());
        return;
      }
      if (/^ref\s*:/i.test(line)) return;

      // 폴더 방식: 'folder: <슬러그>' → workshops/<슬러그>/index.md 상세 페이지 연결
      const fm = line.match(/^folder\s*:\s*([A-Za-z0-9_-]+)\s*$/i);
      if (fm) {
        if (!ws) {
          if (!cat) cat = { name: '워크샵', workshops: [] };
          ws = { title: fm[1], badges: [], description: '', links: [], folder: '' };
        }
        ws.folder = fm[1];
        return;
      }

      // 링크 줄 (파이프로 추가 배지 지원)
      const parts = line.split('|');
      const head = parts[0];
      const urlMatch = head.match(/https?:\/\/github\.com\/[^\s)\]]+/i);
      if (urlMatch) {
        const info = repoOf(urlMatch[0]);
        if (!info) return;
        let label = head
          .slice(0, urlMatch.index)
          .replace(/^[-*]\s*/, '')
          .replace(/[[\]]/g, '')
          .replace(/[:：]\s*$/, '')
          .replace(/\*\*/g, '')
          .trim();
        const link = { label, url: urlMatch[0], owner: info.owner, repo: info.repo };
        const extraBadges = parts.slice(1).map((p) => p.trim()).filter(Boolean);

        if (!ws) {
          if (!cat) cat = { name: '워크샵', workshops: [] };
          ws = { title: label || info.repo, badges: [], description: '', links: [], folder: '' };
          ws.links.push(link);
          extraBadges.forEach((b) => ws.badges.push(b));
          flushWs();
        } else {
          ws.links.push(link);
          extraBadges.forEach((b) => ws.badges.push(b));
        }
        return;
      }

      // 설명 줄
      if (ws) {
        const clean = line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim();
        if (clean) ws.description += (ws.description ? ' ' : '') + clean;
      }
    });

    flushCat();
    return categories;
  }

  // 설명이 비어 있는 워크샵은 GitHub API 설명으로 보완
  async function enrich(ws) {
    if (ws.description || !ws.links.length) return;
    const l = ws.links[0];
    try {
      const res = await fetch(`https://api.github.com/repos/${l.owner}/${l.repo}`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (res.ok) {
        const data = await res.json();
        ws.description = data.description || '';
      }
    } catch (err) {
      /* 무시하고 설명 없이 렌더링 */
    }
  }

  function renderLinks(ws) {
    if (ws.links.length === 1 && !ws.links[0].label) {
      return `<a class="card-link" href="${escapeHtml(ws.links[0].url)}" target="_blank" rel="noopener">워크샵 바로가기 <span class="arrow">→</span></a>`;
    }
    return (
      '<div class="workshop-links">' +
      ws.links
        .map((l) => {
          const label = l.label || l.repo;
          return `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(label)} <span class="arrow">→</span></a>`;
        })
        .join('') +
      '</div>'
    );
  }

  // 폴더 방식이면 내부 상세 페이지 링크를, 아니면 기존 레포 링크를 렌더링
  function renderActions(ws) {
    if (ws.folder) {
      const detail = `<a class="card-link" href="workshop.html?slug=${encodeURIComponent(ws.folder)}">워크샵 바로가기 <span class="arrow">→</span></a>`;
      const repos = ws.links.length
        ? '<div class="workshop-links">' +
          ws.links
            .map((l) => {
              const label = l.label || l.repo;
              return `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(label)} <span class="arrow">→</span></a>`;
            })
            .join('') +
          '</div>'
        : '';
      return detail + repos;
    }
    return renderLinks(ws);
  }

  // 워크샵 아이콘 (비커/실습)
  const WS_ICON =
    '<path d="M9 3h6M10 3v6l-5 8a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-8V3"/><path d="M7.5 14h9"/>';

  // 가로형 카드 오른쪽 액션 (워크샵 바로가기 · 실습 레포 링크)
  function renderRowActions(ws) {
    const primary = (href, label, internal) =>
      `<a class="btn-detail" href="${escapeHtml(href)}"${internal ? '' : ' target="_blank" rel="noopener"'}>${escapeHtml(label)} <span class="arrow">→</span></a>`;
    const repoList = (links) =>
      `<div class="srow-workshops"><span class="sw-label">실습 레포</span>${links
        .map(
          (l) =>
            `<a class="sw-link" href="${escapeHtml(l.url)}" target="_blank" rel="noopener"><span class="sw-name">${escapeHtml(l.label || l.repo)}</span> <span class="arrow">↗</span></a>`
        )
        .join('')}</div>`;

    if (ws.folder) {
      const detail = primary(`workshop.html?slug=${encodeURIComponent(ws.folder)}`, '워크샵 바로가기', true);
      return detail + (ws.links.length ? repoList(ws.links) : '');
    }
    if (ws.links.length === 1 && !ws.links[0].label) {
      return primary(ws.links[0].url, '워크샵 바로가기', false);
    }
    if (ws.links.length) {
      return repoList(ws.links);
    }
    return '';
  }

  // 가로형(한 행에 하나) 워크샵 카드
  function renderRowCard(ws) {
    const meta = ws.badges.length
      ? `<div class="workshop-meta">${ws.badges.map((b) => `<span>🏷️ ${escapeHtml(b)}</span>`).join('')}</div>`
      : '';
    const desc = ws.description ? `<p>${escapeHtml(ws.description)}</p>` : '';
    return `
      <article class="card solution-row reveal visible">
        <div class="srow-main">
          <div class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${WS_ICON}</svg>
          </div>
          <div class="srow-body">
            <div class="card-tags"><span class="tag workshop">Hands-on Lab</span></div>
            <h3>${escapeHtml(ws.title)}</h3>
            ${desc}
            ${meta}
          </div>
        </div>
        <div class="srow-actions">${renderRowActions(ws)}</div>
      </article>`;
  }

  // ---- 상태 & 뷰 렌더링 (카테고리 필터 + 페이지네이션) ----
  const WS_PAGE_SIZE = 3; // 한 화면 최대 3행
  let wsGroups = [];
  let wsAll = [];
  let wsCat = '__all';
  let wsPage = 1;

  function wsListFor(cat) {
    if (cat === '__all') return wsAll;
    const g = wsGroups.find((x) => x.name === cat);
    return g ? g.workshops : [];
  }

  function renderWsPager(totalPages) {
    let btns = '';
    for (let i = 1; i <= totalPages; i++) {
      btns += `<button class="page-btn${i === wsPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    }
    return `
      <nav class="pagination" aria-label="워크샵 페이지 네비게이션">
        <button class="page-btn" data-page="${wsPage - 1}"${wsPage === 1 ? ' disabled' : ''}>← 이전</button>
        ${btns}
        <button class="page-btn" data-page="${wsPage + 1}"${wsPage === totalPages ? ' disabled' : ''}>다음 →</button>
      </nav>`;
  }

  function renderWsView() {
    const list = wsListFor(wsCat);
    const totalPages = Math.max(1, Math.ceil(list.length / WS_PAGE_SIZE));
    if (wsPage > totalPages) wsPage = totalPages;
    const start = (wsPage - 1) * WS_PAGE_SIZE;
    const pageItems = list.slice(start, start + WS_PAGE_SIZE);
    const title = wsCat === '__all' ? '전체' : wsCat;
    container.innerHTML = `
      <section class="cat-group">
        <h3 class="cat-title">${escapeHtml(title)} <span class="cat-count">${list.length}</span></h3>
        <div class="solution-rows">${pageItems.map(renderRowCard).join('')}</div>
        ${totalPages > 1 ? renderWsPager(totalPages) : ''}
      </section>`;
  }

  async function load() {
    let text;
    try {
      const res = await fetch(source, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
    } catch (err) {
      container.innerHTML = `<div class="workshop-loading">워크샵 목록(<code>${escapeHtml(source)}</code>)을 불러오지 못했습니다.</div>`;
      return;
    }

    const categories = parse(text);
    wsAll = categories.flatMap((c) => c.workshops);
    if (!wsAll.length) {
      container.innerHTML = `<div class="workshop-loading">아직 등록된 워크샵이 없습니다. <code>docs/workshops/workshops.md</code> 파일을 편집하세요.</div>`;
      if (nav) nav.innerHTML = '';
      return;
    }
    setRoundedStat('statWorkshops', wsAll.length);

    const catalog = await window.WorkshopData.loadCatalog();
    wsAll.forEach(workshop => {
      const metadata = window.WorkshopData.findMetadata(catalog, workshop.folder, workshop.links[0]?.url);
      if (!metadata) return;
      workshop.title = metadata.title;
      workshop.description = metadata.description;
      workshop.badges = window.WorkshopData.metadataBadges(metadata);
    });
    await Promise.all(wsAll.map(enrich));

    // 같은 카테고리 이름끼리 병합 (솔루션과 동일한 카테고리 기준)
    const merged = new Map();
    categories.forEach((c) => {
      if (!merged.has(c.name)) merged.set(c.name, { name: c.name, workshops: [] });
      merged.get(c.name).workshops.push(...c.workshops);
    });
    wsGroups = [...merged.values()];

    // 왼쪽: 카테고리 네비게이션 (전체 + 카테고리별 개수)
    if (nav) {
      nav.innerHTML =
        `<button class="cat-item active" data-cat="__all">전체 <span class="count">${wsAll.length}</span></button>` +
        wsGroups
          .map(
            (g) =>
              `<button class="cat-item" data-cat="${escapeHtml(g.name)}">${escapeHtml(g.name)} <span class="count">${g.workshops.length}</span></button>`
          )
          .join('');
      nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.cat-item');
        if (!btn) return;
        nav.querySelectorAll('.cat-item').forEach((b) => b.classList.toggle('active', b === btn));
        wsCat = btn.getAttribute('data-cat');
        wsPage = 1;
        renderWsView();
      });
    }

    // 페이지네이션 클릭 (이벤트 위임)
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.page-btn');
      if (!btn || btn.disabled) return;
      const p = parseInt(btn.getAttribute('data-page'), 10);
      if (!p || p === wsPage) return;
      wsPage = p;
      renderWsView();
      const head = document.getElementById('workshops');
      if (head) head.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    renderWsView();
  }

  load();
})();

/* ============================================================
   Site search
   솔루션 설명 자료(solutions.md) · 실습 워크샵(workshops.md) ·
   신규 기능 업데이트(updates.json)를 통합 검색합니다.
   검색 결과는 2단(왼쪽 분류 / 오른쪽 카드)으로 표시합니다.
   ============================================================ */
(function initSearch() {
  const form = document.getElementById('siteSearch');
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  const grid = document.getElementById('searchGrid');
  const nav = document.getElementById('searchNav');
  const titleEl = document.getElementById('searchResultsTitle');
  const closeBtn = document.getElementById('searchClose');
  if (!form || !input || !results || !grid || !nav) return;

  const esc = (s) =>
    String(s || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const TYPES = {
    solution: { label: '솔루션 설명 자료', tag: 'solution', cta: '자세히 보기' },
    workshop: { label: '실습 워크샵', tag: 'workshop', cta: '워크샵 바로가기' },
    update: { label: '신규 기능 업데이트', tag: 'update', cta: '릴리스 노트' },
  };
  const TYPE_ORDER = ['solution', 'workshop', 'update'];

  // 검색 약어집(동의어) — assets/js/search-synonyms.js 에서 로드 (없으면 빈 배열)
  const SYNONYMS = Array.isArray(window.SEARCH_SYNONYMS) ? window.SEARCH_SYNONYMS : [];

  let indexPromise = null;
  let curType = '__all';
  let curResults = [];
  let searchPage = 1;
  const SEARCH_PAGE_SIZE = 4; // 한 페이지 최대 4개

  function fmtDate(v) {
    if (!v) return '';
    const d = new Date(String(v).replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  }

  // ---- 데이터 소스 파싱 (검색용 최소 정보) ----
  function parseSolutions(text) {
    const cleaned = text.replace(/<!--[\s\S]*?-->/g, '');
    const out = [];
    let cur = null;
    cleaned.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line || (line.startsWith('#') && !line.startsWith('###'))) return;
      if (line.startsWith('### ')) {
        cur = { title: line.slice(4).trim(), summary: '', slug: '', url: '', tag: '', date: '' };
        out.push(cur);
        return;
      }
      if (!cur) return;
      if (/^workshop\s*:/i.test(line)) return;
      const m = line.match(/^(slug|tag|icon|url|category|date)\s*:\s*(.+)$/i);
      if (m) {
        const k = m[1].toLowerCase();
        if (k === 'slug') cur.slug = m[2].trim();
        else if (k === 'url') cur.url = m[2].trim();
        else if (k === 'tag') cur.tag = m[2].trim();
        else if (k === 'date') cur.date = m[2].trim();
      } else {
        cur.summary += (cur.summary ? ' ' : '') + line;
      }
    });
    return out
      .filter((s) => s.slug || s.url)
      .map((s) => {
        const isUrl = s.url && /^https?:\/\//i.test(s.url);
        return {
          type: 'solution',
          title: s.title,
          summary: s.summary,
          extra: s.tag,
          date: s.date,
          url: isUrl
            ? s.url
            : `solution.html?slug=${encodeURIComponent((s.slug || '').replace(/[^A-Za-z0-9_-]/g, ''))}`,
          external: !!isUrl,
        };
      });
  }

  function parseWorkshops(text) {
    const cleaned = text.replace(/<!--[\s\S]*?-->/g, '');
    const out = [];
    let cat = '';
    let cur = null;
    const flush = () => {
      if (cur) out.push(cur);
      cur = null;
    };
    cleaned.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      if (line.startsWith('## ')) {
        flush();
        cat = line.slice(3).trim();
        return;
      }
      if (line.startsWith('### ')) {
        flush();
        let t = line.slice(4).trim();
        const p = t.match(/\(([^)]*)\)\s*$/);
        if (p) t = t.slice(0, p.index).trim();
        cur = { type: 'workshop', title: t, summary: '', url: '', extra: cat, date: '', external: true };
        return;
      }
      if (line.startsWith('#')) return;
      if (/^(included|ref)\s*:/i.test(line)) return;
      const fm = line.match(/^folder\s*:\s*([A-Za-z0-9_-]+)\s*$/i);
      if (fm) {
        if (!cur) cur = { type: 'workshop', title: cat || '워크샵', summary: '', url: '', extra: cat, date: '', external: false };
        cur.folder = fm[1];
        cur.url = `workshop.html?slug=${encodeURIComponent(fm[1])}`;
        cur.external = false;
        return;
      }
      const head = line.split('|')[0];
      const um = head.match(/https?:\/\/github\.com\/[^\s)\]]+/i);
      if (um) {
        if (!cur) cur = { type: 'workshop', title: cat || '워크샵', summary: '', url: '', extra: cat, date: '', external: true };
        if (!cur.repo) cur.repo = um[0];
        if (!cur.url) cur.url = um[0];
        return;
      }
      if (cur) {
        const c = line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim();
        if (c) cur.summary += (cur.summary ? ' ' : '') + c;
      }
    });
    flush();
    return out;
  }

  function buildIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = Promise.all([
      fetch('solutions/solutions.md', { cache: 'no-cache' }).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
      fetch('workshops/workshops.md', { cache: 'no-cache' }).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
      // 신규 기능: 누적 아카이브(all.json)를 우선 사용하고, 없으면 최신 스냅샷으로 폴백
      fetch('updates/all.json', { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then((j) => j || fetch('updates/updates.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : { items: [] })).catch(() => ({ items: [] }))),
      window.WorkshopData.loadCatalog(),
    ]).then(([solText, wsText, upJson, catalog]) => {
      const items = [];
      parseSolutions(solText).forEach((s) => items.push(s));
      parseWorkshops(wsText).forEach((workshop) => {
        const metadata = window.WorkshopData.findMetadata(catalog, workshop.folder, workshop.repo);
        if (metadata) {
          workshop.title = metadata.title;
          workshop.summary = metadata.description;
          workshop.extra += ` ${metadata.tags.join(' ')} ${window.WorkshopData.metadataBadges(metadata).join(' ')}`;
          workshop.date = metadata.last_updated;
        }
        items.push(workshop);
      });
      (Array.isArray(upJson.items) ? upJson.items : []).forEach((u) => {
        items.push({
          type: 'update',
          title: u.titleKo || u.title || '',
          summary: u.summaryKo || '',
          extra: `${u.category || ''} ${fmtDate(u.date)}`,
          date: u.date || '',
          url: /^https?:\/\//i.test(u.link || '') ? u.link : '#',
          external: true,
        });
      });
      return items;
    });
    return indexPromise;
  }

  // ---- 렌더링 ----
  function typeCounts() {
    const c = { solution: 0, workshop: 0, update: 0 };
    curResults.forEach((r) => { c[r.type] = (c[r.type] || 0) + 1; });
    return c;
  }

  function renderNav() {
    const c = typeCounts();
    nav.innerHTML =
      `<button class="cat-item${curType === '__all' ? ' active' : ''}" data-type="__all">전체 <span class="count">${curResults.length}</span></button>` +
      TYPE_ORDER.map(
        (t) =>
          `<button class="cat-item${curType === t ? ' active' : ''}" data-type="${t}">${esc(TYPES[t].label)} <span class="count">${c[t] || 0}</span></button>`
      ).join('');
  }

  function renderResultCard(it) {
    const t = TYPES[it.type] || TYPES.solution;
    const attrs = it.external ? ' target="_blank" rel="noopener"' : '';
    const dateHtml = it.date ? `<span class="card-date">${esc(fmtDate(it.date))}</span>` : '<span class="card-date"></span>';
    return `
      <article class="card reveal visible">
        <div class="card-top"></div>
        <div class="card-body">
          <span class="tag ${t.tag}">${esc(t.label)}</span>
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.summary)}</p>
          <div class="card-foot">
            ${dateHtml}
            <a class="card-link" href="${esc(it.url)}"${attrs}>${esc(t.cta)} <span class="arrow">→</span></a>
          </div>
        </div>
      </article>`;
  }

  function renderGrid() {
    const list = curType === '__all' ? curResults : curResults.filter((r) => r.type === curType);
    if (!list.length) {
      grid.innerHTML = '<div class="workshop-loading">검색 결과가 없습니다.</div>';
      return;
    }
    const totalPages = Math.max(1, Math.ceil(list.length / SEARCH_PAGE_SIZE));
    if (searchPage > totalPages) searchPage = totalPages;
    const start = (searchPage - 1) * SEARCH_PAGE_SIZE;
    const pageItems = list.slice(start, start + SEARCH_PAGE_SIZE);
    const cards = `<div class="grid grid-2">${pageItems.map(renderResultCard).join('')}</div>`;
    grid.innerHTML = cards + (totalPages > 1 ? renderSearchPager(totalPages) : '');
  }

  function renderSearchPager(totalPages) {
    let btns = '';
    for (let i = 1; i <= totalPages; i++) {
      btns += `<button class="page-btn${i === searchPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    }
    return `
      <nav class="pagination" aria-label="검색 결과 페이지">
        <button class="page-btn" data-page="${searchPage - 1}"${searchPage === 1 ? ' disabled' : ''}>← 이전</button>
        ${btns}
        <button class="page-btn" data-page="${searchPage + 1}"${searchPage === totalPages ? ' disabled' : ''}>다음 →</button>
      </nav>`;
  }

  function openSearch(q) {
    titleEl.textContent = `‘${q}’ 검색 결과`;
    renderNav();
    renderGrid();
    document.querySelectorAll('#main > section').forEach((s) => { s.hidden = true; });
    results.hidden = false;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeSearch() {
    results.hidden = true;
    document.querySelectorAll('#main > section').forEach((s) => { s.hidden = false; });
  }

  // 검색어를 약어집 기준으로 동의어까지 확장
  function expandQuery(q) {
    const ql = q.toLowerCase().trim();
    const terms = new Set([ql]);
    const tokens = ql.split(/\s+/).filter(Boolean);
    const addGroup = (needle) => {
      if (!needle) return;
      for (const group of SYNONYMS) {
        if (group.includes(needle)) group.forEach((g) => terms.add(g));
      }
    };
    addGroup(ql);
    tokens.forEach(addGroup);
    return [...terms].filter(Boolean);
  }

  function doSearch(q) {
    q = (q || '').trim();
    if (!q) { closeSearch(); return; }
    buildIndex().then((items) => {
      const terms = expandQuery(q);
      curResults = items.filter((it) => {
        const hay = `${it.title || ''} ${it.summary || ''} ${it.extra || ''}`.toLowerCase();
        return terms.some((t) => hay.includes(t));
      });
      curType = '__all';
      searchPage = 1;
      openSearch(q);
    });
  }

  // ---- 이벤트 ----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    doSearch(input.value);
  });
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (!input.value.trim()) closeSearch();
      else doSearch(input.value);
    }, 250);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { input.value = ''; closeSearch(); }
  });
  if (closeBtn) closeBtn.addEventListener('click', () => { input.value = ''; closeSearch(); input.focus(); });
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('.cat-item');
    if (!b) return;
    curType = b.getAttribute('data-type');
    searchPage = 1;
    renderNav();
    renderGrid();
  });

  // 검색 결과 페이지네이션 클릭
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.page-btn');
    if (!b || b.disabled) return;
    const p = parseInt(b.getAttribute('data-page'), 10);
    if (!p || p === searchPage) return;
    searchPage = p;
    renderGrid();
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
