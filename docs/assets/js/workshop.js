// 실습 워크샵 뷰어
// workshop.html?slug=<slug> → workshops/<slug>/index.md 매니페스트를 읽어
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
  const helpers = window.WorkshopData;

  const esc = (s) =>
    String(s || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const renderMd = (md) => {
    const body = helpers.stripFrontmatter(md);
    const html = window.marked ? window.marked.parse(body) : esc(body);
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
        img.setAttribute('src', blobToRaw(src));
      } else if (!/^(https?:)?\/\//i.test(src)) {
        try { img.setAttribute('src', new URL(src.startsWith('/') && rawRoot ? rawRoot + src.slice(1) : src, baseUrl).href); } catch (e) { /* noop */ }
      }
      img.setAttribute('loading', 'lazy');
    });
    container.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href) return;
      try {
        const link = helpers.resolveLink(href, baseUrl, model);
        if (link.key !== undefined) {
          a.setAttribute('href', pageUrl(link.key, link.hash));
          a.setAttribute('data-ws-key', link.key);
          a.setAttribute('data-ws-hash', link.hash || '');
          a.removeAttribute('target');
        } else {
          a.setAttribute('href', link.href);
        }
        if (link.external) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
        }
      } catch (error) { a.removeAttribute('href'); }
    });
  }

  // 매니페스트 파싱: '# 제목' + repo + 개요(첫 '## ' 이전) + 스텝('## 제목' + source + 설명)
  const parseManifest = helpers.parseManifest;

  let model = null;
  let current = 'overview';
  let requestId = 0;

  function pageUrl(key, hash = '') {
    const url = new URL(location.href);
    if (key === 'overview') url.searchParams.delete('step');
    else url.searchParams.set('step', model.steps[Number(key)]?.id || key);
    url.hash = hash;
    return url.href;
  }

  function navigate(key, hash = '') {
    window.history?.pushState(null, '', pageUrl(key, hash));
    renderContent(key, hash);
  }

  function showLocation() {
    const value = new URLSearchParams(location.search).get('step');
    const index = model.steps.findIndex((step, position) => (step.id || String(position)) === value);
    renderContent(index < 0 ? navItems()[0].key : String(index), location.hash || '');
  }

  function decorate(baseUrl, hash) {
    const counts = new Map();
    contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
      if (heading.id) return;
      const name = heading.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/\s/g, '-');
      const count = counts.get(name) || 0;
      counts.set(name, count + 1);
      heading.id = name + (count ? `-${count}` : '');
    });
    fixRelativePaths(contentEl, baseUrl);
    let target;
    try { target = Array.from(contentEl.querySelectorAll('[id]')).find(node => node.id === decodeURIComponent(hash.replace(/^#/, ''))); } catch (error) { /* noop */ }
    (target || contentEl).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderHead() {
    const repoBtn = model.repo
      ? `<a class="ws-repo" href="${esc(model.repo)}" target="_blank" rel="noopener">GitHub 저장소 <span class="arrow">↗</span></a>`
      : '';
    const metadata = model.metadata;
    const codespaces = metadata?.execution.includes('codespaces')
      ? `<a class="ws-repo" href="https://codespaces.new/${esc(model.repo.replace('https://github.com/', ''))}?ref=${encodeURIComponent(metadata.ref)}" target="_blank" rel="noopener">Open in Codespaces <span class="arrow">↗</span></a>`
      : '';
    const badges = metadata ? `<div class="workshop-meta">${helpers.metadataBadges(metadata).map(label => `<span>${esc(label)}</span>`).join('')}</div>` : '';
    headEl.innerHTML = `
      <div class="ws-head-inner">
        <span class="tag workshop">Hands-on Lab</span>
        <h1>${esc(model.title || '실습 워크샵')}</h1>
      </div>
      ${badges}
      <div class="ws-actions">${repoBtn}${codespaces}</div>`;
    if (crumb) crumb.textContent = model.title || '실습 워크샵';
    document.title = `${model.title || '실습 워크샵'} · Microsoft Korea Solution Hub`;
  }

  function navItems() {
    const items = [];
    if (model.overview) items.push({ key: 'overview', label: '개요' });
    model.steps.forEach((s, i) => items.push({ key: String(i), label: s.title, parent: s.parent, duration: s.duration_minutes }));
    if (!items.length) items.push({ key: 'overview', label: '개요' });
    return items;
  }

  function renderNav() {
    const items = navItems();
    navEl.innerHTML =
      '<div class="ws-nav-title">실습 단계</div>' +
      items
        .map(
          (it, i) =>
            `<button class="ws-step${it.key === current ? ' active' : ''}${it.parent ? ' ws-substep' : ''}" data-key="${esc(it.key)}"${it.key === current ? ' aria-current="step"' : ''}>
               <span class="ws-step-no">${it.key === 'overview' ? '📋' : i + (model.overview ? 0 : 1)}</span>
               <span class="ws-step-label">${esc(it.label)}${it.duration ? `<small>${it.duration}분</small>` : ''}</span>
             </button>`
        )
        .join('');
  }

  function showLoading() {
    contentEl.innerHTML = '<div class="workshop-loading">콘텐츠를 불러오는 중입니다…</div>';
  }

  function renderContent(key, hash = '') {
    const activeRequest = ++requestId;
    current = key;
    renderNav();

    if (key === 'overview') {
      contentEl.innerHTML = renderMd(model.overview);
      decorate(model.metadata?.overview_source || manifestUrlAbsolute(), hash);
      return;
    }

    const step = model.steps[Number(key)];
    if (!step) { contentEl.innerHTML = '<div class="workshop-loading">단계를 찾을 수 없습니다.</div>'; return; }

    const notebookLinks = (step.notebooks || []).map(path => {
      const href = `${model.repo}/blob/${model.metadata.source_commit}/${path.split('/').map(encodeURIComponent).join('/')}`;
      return `<a class="ws-repo" href="${esc(href)}" target="_blank" rel="noopener">${esc(path.split('/').pop())} <span class="arrow">↗</span></a>`;
    }).join('');
    const descHtml = (notebookLinks ? `<div class="ws-actions" aria-label="GitHub 노트북">${notebookLinks}</div>` : '') + (step.desc.join('\n').trim() ? `<div class="ws-step-desc">${renderMd(step.desc.join('\n'))}</div>` : '');

    if (!step.source) {
      contentEl.innerHTML = descHtml || '<div class="workshop-loading">이 단계의 자료는 준비 중입니다.</div>';
      decorate(manifestUrlAbsolute(), hash);
      return;
    }

    showLoading();
    fetch(step.source, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((md) => {
        if (activeRequest !== requestId) return;
        contentEl.innerHTML = descHtml + renderMd(md);
        decorate(step.source, hash);
      })
      .catch(() => {
        if (activeRequest !== requestId) return;
        contentEl.innerHTML =
          descHtml +
          '<div class="workshop-loading">원본 콘텐츠를 불러오지 못했습니다. ' +
          `<a href="${esc(helpers.resolveLink(step.source, step.source, { ...model, steps: [] }).href)}" target="_blank" rel="noopener">원문 보기 ↗</a></div>`;
      });
  }

  function manifestUrlAbsolute() {
    try { return new URL(manifestUrl, location.href).href; } catch (e) { return location.href; }
  }

  navEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.ws-step');
    if (!btn) return;
    navigate(btn.getAttribute('data-key'));
  });

  contentEl.addEventListener('click', event => {
    const link = event.target.closest('a[data-ws-key]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
    event.preventDefault();
    navigate(link.getAttribute('data-ws-key'), link.getAttribute('data-ws-hash'));
  });
  window.addEventListener('popstate', () => { if (model) showLocation(); });

  fetch(manifestUrl, { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => {
      model = parseManifest(text);
      renderHead();
      renderNav();
      showLocation();
    })
    .catch(() => {
      contentEl.innerHTML =
        '<div class="workshop-loading">이 워크샵의 자료는 아직 준비 중입니다.<br />' +
        `(<code>${rootDir}/${slug}/index.md</code> 파일을 추가하면 이곳에 표시됩니다.)</div>`;
      if (crumb) crumb.textContent = '준비 중';
    });
})();
