// 실습 워크샵 뷰어
// workshop.html?slug=<slug> → solutions/<slug>/index.md 매니페스트를 읽어
// 왼쪽 단계(스텝) 네비 + 오른쪽 콘텐츠(원본 저장소 raw 를 실시간 렌더)로 표시합니다.
(function () {
  const headEl = document.getElementById('wsHead');
  const navEl = document.getElementById('wsNav');
  const contentEl = document.getElementById('wsContent');
  const crumb = document.getElementById('crumbTitle');
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (!contentEl) return;

  const rootDir = 'workshops';
  const raw = new URLSearchParams(location.search).get('slug') || '';
  const slug = raw.replace(/[^A-Za-z0-9_-]/g, '');
  if (!slug) {
    contentEl.innerHTML = '<div class="workshop-loading">잘못된 접근입니다. 워크샵을 선택해 주세요.</div>';
    return;
  }
  const manifestUrl = `${rootDir}/${slug}/index.md`;

  const esc = (s) =>
    String(s || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const renderMd = (md) => {
    const html = window.marked ? window.marked.parse(md || '') : esc(md || '');
    return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
  };

  // 렌더된 콘텐츠의 상대 경로(이미지/링크)를 원본 문서(baseUrl) 기준으로 절대화
  function fixRelativePaths(container, baseUrl) {
    // 단계 소스와 동일한 레포 루트 raw 경로 (예: .../<owner>/<repo>/<branch>/)
    const rawRoot = (() => {
      const m = String(baseUrl).match(/^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\//);
      return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/` : null;
    })();
    // GitHub blob URL(HTML 페이지)을 raw 로 변환: github.com/<o>/<r>/blob/<ref>/<path> → raw
    const blobToRaw = (u) => {
      const m = String(u).match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i);
      return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}` : u;
    };
    container.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) { img.setAttribute('loading', 'lazy'); return; }
      const blob = src.match(/^https?:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/(.+)$/i);
      if (blob) {
        // 원본이 하드코딩한 blob URL. 이미지는 단계 소스와 같은 레포 루트에 있으므로 그쪽으로 해석
        img.setAttribute('src', rawRoot ? rawRoot + blob[1] : blobToRaw(src));
      } else if (!/^(https?:)?\/\//i.test(src)) {
        try { img.setAttribute('src', new URL(src, baseUrl).href); } catch (e) { /* noop */ }
      }
      img.setAttribute('loading', 'lazy');
    });
    container.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (/^https?:\/\//i.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      } else if (baseUrl) {
        try {
          a.setAttribute('href', new URL(href, baseUrl).href);
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
        } catch (e) { /* noop */ }
      }
    });
  }

  // 매니페스트 파싱: '# 제목' + repo + 개요(첫 '## ' 이전) + 스텝('## 제목' + source + 설명)
  function parseManifest(text) {
    const clean = text.replace(/<!--[\s\S]*?-->/g, '');
    const lines = clean.split(/\r?\n/);
    let title = '';
    let repo = '';
    const overview = [];
    const steps = [];
    let cur = null;
    let seenStep = false;

    for (const line of lines) {
      const t = line.trim();
      if (!seenStep && /^#\s+/.test(t) && !/^##/.test(t)) {
        title = t.replace(/^#\s+/, '').trim();
        continue;
      }
      const stepM = t.match(/^##\s+(.+)$/);
      if (stepM) {
        seenStep = true;
        cur = { title: stepM[1].trim(), source: '', desc: [] };
        steps.push(cur);
        continue;
      }
      if (!seenStep) {
        const r = t.match(/^repo\s*:\s*(.+)$/i);
        if (r) { repo = r[1].trim(); continue; }
        overview.push(line);
        continue;
      }
      const s = t.match(/^source\s*:\s*(.+)$/i);
      if (s) { cur.source = s[1].trim(); continue; }
      cur.desc.push(line);
    }
    return { title, repo, overview: overview.join('\n').trim(), steps };
  }

  let model = null;
  let current = 'overview';

  function renderHead() {
    const repoBtn = model.repo
      ? `<a class="ws-repo" href="${esc(model.repo)}" target="_blank" rel="noopener">GitHub 저장소 <span class="arrow">↗</span></a>`
      : '';
    headEl.innerHTML = `
      <div class="ws-head-inner">
        <span class="tag workshop">Hands-on Lab</span>
        <h1>${esc(model.title || '실습 워크샵')}</h1>
        ${repoBtn}
      </div>`;
    if (crumb) crumb.textContent = model.title || '실습 워크샵';
    document.title = `${model.title || '실습 워크샵'} · Microsoft Korea Solution Hub`;
  }

  function navItems() {
    const items = [];
    if (model.overview) items.push({ key: 'overview', label: '개요' });
    model.steps.forEach((s, i) => items.push({ key: String(i), label: s.title }));
    if (!items.length) items.push({ key: 'overview', label: '개요' });
    return items;
  }

  function renderNav() {
    const items = navItems();
    const overviewIcon =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>';
    navEl.innerHTML =
      '<div class="ws-nav-title">실습 단계</div>' +
      items
        .map(
          (it, i) =>
            `<button class="ws-step${it.key === current ? ' active' : ''}" data-key="${esc(it.key)}">
               <span class="ws-step-no">${it.key === 'overview' ? overviewIcon : i + (model.overview ? 0 : 1)}</span>
               <span class="ws-step-label">${esc(it.label)}</span>
             </button>`
        )
        .join('');
  }

  function showLoading() {
    contentEl.innerHTML = '<div class="workshop-loading">콘텐츠를 불러오는 중입니다…</div>';
  }

  function renderContent(key) {
    current = key;
    renderNav();

    if (key === 'overview') {
      contentEl.innerHTML = renderMd(model.overview);
      fixRelativePaths(contentEl, manifestUrlAbsolute());
      contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const step = model.steps[Number(key)];
    if (!step) { contentEl.innerHTML = '<div class="workshop-loading">단계를 찾을 수 없습니다.</div>'; return; }

    const descHtml = step.desc.join('\n').trim() ? `<div class="ws-step-desc">${renderMd(step.desc.join('\n'))}</div>` : '';

    if (!step.source) {
      contentEl.innerHTML = descHtml || '<div class="workshop-loading">이 단계의 자료는 준비 중입니다.</div>';
      contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    showLoading();
    fetch(step.source, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((md) => {
        contentEl.innerHTML = descHtml + renderMd(md);
        fixRelativePaths(contentEl, step.source);
        contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(() => {
        contentEl.innerHTML =
          descHtml +
          '<div class="workshop-loading">원본 콘텐츠를 불러오지 못했습니다. ' +
          `<a href="${esc(step.source)}" target="_blank" rel="noopener">원문 보기 ↗</a></div>`;
      });
  }

  function manifestUrlAbsolute() {
    try { return new URL(manifestUrl, location.href).href; } catch (e) { return location.href; }
  }

  navEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.ws-step');
    if (!btn) return;
    renderContent(btn.getAttribute('data-key'));
  });

  fetch(manifestUrl, { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => {
      model = parseManifest(text);
      renderHead();
      renderNav();
      const first = navItems()[0];
      renderContent(first.key);
    })
    .catch(() => {
      contentEl.innerHTML =
        '<div class="workshop-loading">이 워크샵의 자료는 아직 준비 중입니다.<br />' +
        `(<code>${rootDir}/${slug}/index.md</code> 파일을 추가하면 이곳에 표시됩니다.)</div>`;
      if (crumb) crumb.textContent = '준비 중';
    });
})();
