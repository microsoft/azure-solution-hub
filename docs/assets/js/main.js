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
   Dynamic solutions
   solutions/solutions.md 매니페스트를 읽어 솔루션 카드를 렌더링합니다.
   각 카드는 solution.html?slug=<slug> 상세 페이지로 연결됩니다.
   ============================================================ */
(function initSolutions() {
  const grid = document.getElementById('solutionGrid');
  if (!grid) return;

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

  // 매니페스트 파싱: '### 제목' + slug/tag/icon + 요약 문장
  function parse(text) {
    const cleaned = text.replace(/<!--[\s\S]*?-->/g, '');
    const items = [];
    let cur = null;
    cleaned.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line || line.startsWith('#') && !line.startsWith('###')) return;
      if (line.startsWith('### ')) {
        cur = { title: line.slice(4).trim(), slug: '', tag: '', icon: 'cloud', summary: '' };
        items.push(cur);
        return;
      }
      if (!cur) return;
      const meta = line.match(/^(slug|tag|icon)\s*:\s*(.+)$/i);
      if (meta) {
        cur[meta[1].toLowerCase()] = meta[2].trim();
      } else {
        cur.summary += (cur.summary ? ' ' : '') + line;
      }
    });
    return items.filter((it) => it.slug);
  }

  function renderCard(it) {
    const slug = it.slug.replace(/[^A-Za-z0-9_-]/g, '');
    const icon = ICONS[it.icon] || ICONS.cloud;
    return `
      <article class="card reveal visible">
        <div class="card-top"></div>
        <div class="card-body">
          <div class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${icon}</svg>
          </div>
          <span class="tag solution">${esc(it.tag)}</span>
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.summary)}</p>
          <a class="card-link" href="solution.html?slug=${encodeURIComponent(slug)}">자세히 보기 <span class="arrow">→</span></a>
        </div>
      </article>`;
  }

  fetch(source, { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => {
      const items = parse(text);
      if (!items.length) {
        grid.innerHTML = '<div class="workshop-loading">등록된 솔루션이 없습니다.</div>';
        return;
      }
      grid.innerHTML = items.map(renderCard).join('');
    })
    .catch(() => {
      grid.innerHTML = '<div class="workshop-loading">솔루션 목록을 불러오지 못했습니다.</div>';
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

  const source = container.getAttribute('data-source') || 'workshops.md';

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
        ws = { title, badges, description: '', links: [] };
        return;
      }
      // 다른 주석 줄 무시
      if (line.startsWith('#')) return;

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
          ws = { title: label || info.repo, badges: [], description: '', links: [] };
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
          const label = l.label || `${l.owner}/${l.repo}`;
          return `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(label)} <span class="arrow">→</span></a>`;
        })
        .join('') +
      '</div>'
    );
  }

  // 메인에 기본으로 노출할 워크샵 수 (섹션별 최신 N개)
  const PREVIEW_COUNT = 3;

  function renderCard(ws, isHidden) {
    const meta = ws.badges.length
      ? `<div class="workshop-meta">${ws.badges.map((b) => `<span>🏷️ ${escapeHtml(b)}</span>`).join('')}</div>`
      : '';
    const desc = ws.description ? `<p>${escapeHtml(ws.description)}</p>` : '';
    return `
      <article class="card reveal visible${isHidden ? ' workshop-hidden' : ''}"${isHidden ? ' hidden' : ''}>
        <div class="card-top"></div>
        <div class="card-body">
          <span class="tag workshop">Hands-on Lab</span>
          <h4>${escapeHtml(ws.title)}</h4>
          ${desc}
          ${meta}
          ${renderLinks(ws)}
        </div>
      </article>`;
  }

  function renderCategory(cat) {
    // 나중에 추가된 워크샵이 앞에 오도록 역순 정렬
    const ordered = cat.workshops.slice().reverse();
    const cards = ordered
      .map((ws, i) => renderCard(ws, i >= PREVIEW_COUNT))
      .join('');
    const hiddenCount = Math.max(0, cat.workshops.length - PREVIEW_COUNT);
    const more = hiddenCount
      ? `<div class="workshop-more-wrap">
           <button class="btn-more" type="button" aria-expanded="false">
             더보기 <span class="more-count">+${hiddenCount}</span>
           </button>
         </div>`
      : '';
    return `
      <div class="workshop-category reveal visible">
        <h3 class="workshop-cat-title">${escapeHtml(cat.name)}</h3>
        <div class="workshop-grid">${cards}</div>
        ${more}
      </div>`;
  }

  // 섹션별 "더보기 / 접기" 토글 연결
  function bindMoreButtons() {
    container.querySelectorAll('.btn-more').forEach((btn) => {
      btn.addEventListener('click', () => {
        const category = btn.closest('.workshop-category');
        if (!category) return;
        const hiddenCards = category.querySelectorAll('.workshop-hidden');
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        hiddenCards.forEach((c) => {
          if (expanded) c.setAttribute('hidden', '');
          else c.removeAttribute('hidden');
        });
        btn.setAttribute('aria-expanded', String(!expanded));
        btn.innerHTML = expanded
          ? `더보기 <span class="more-count">+${hiddenCards.length}</span>`
          : '접기 <span class="more-count">▲</span>';
      });
    });
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
    const allWs = categories.flatMap((c) => c.workshops);
    if (!allWs.length) {
      container.innerHTML = `<div class="workshop-loading">아직 등록된 워크샵이 없습니다. <code>docs/workshops.md</code> 파일에 GitHub 레포 URL을 추가하세요.</div>`;
      return;
    }

    await Promise.all(allWs.map(enrich));
    container.innerHTML = categories.map(renderCategory).join('');
    bindMoreButtons();
  }

  load();
})();
