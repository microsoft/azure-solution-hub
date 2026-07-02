// 솔루션 상세 문서 뷰어
// solution.html?slug=<slug> → solutions/<slug>/index.md 를 렌더링합니다.
(function () {
  const doc = document.getElementById('doc');
  const crumb = document.getElementById('crumbTitle');
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (!doc) return;

  const rootDir = doc.getAttribute('data-base') || 'solutions';

  // slug 정규화: 경로 탈출(../) 등 방지, 허용 문자만 남김
  const raw = new URLSearchParams(location.search).get('slug') || '';
  const slug = raw.replace(/[^A-Za-z0-9_-]/g, '');

  if (!slug) {
    doc.innerHTML =
      '<div class="workshop-loading">잘못된 접근입니다. 솔루션을 선택해 주세요.</div>';
    return;
  }

  const base = `${rootDir}/${slug}/`;
  const mdUrl = `${base}index.md`;

  const isAbsolute = (url) => /^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('/') || url.startsWith('data:') || url.startsWith('#') || url.startsWith('mailto:');

  // 렌더링된 콘텐츠의 상대 경로(이미지/링크)를 솔루션 폴더 기준으로 보정
  function fixRelativePaths(container) {
    container.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !isAbsolute(src)) img.setAttribute('src', base + src.replace(/^\.\//, ''));
      img.setAttribute('loading', 'lazy');
    });
    container.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && !isAbsolute(href)) {
        a.setAttribute('href', base + href.replace(/^\.\//, ''));
      } else if (href && /^https?:\/\//i.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      }
    });
  }

  fetch(mdUrl, { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((md) => {
      const rawHtml = window.marked ? window.marked.parse(md) : md;
      const clean = window.DOMPurify ? window.DOMPurify.sanitize(rawHtml) : rawHtml;
      doc.innerHTML = clean;
      fixRelativePaths(doc);

      const h1 = doc.querySelector('h1');
      if (h1) {
        const title = h1.textContent.trim();
        if (crumb) crumb.textContent = title;
        document.title = `${title} · Microsoft Korea Solution Hub`;
      }
    })
    .catch(() => {
      doc.innerHTML =
        '<div class="workshop-loading">이 솔루션의 설명 자료는 아직 준비 중입니다.<br />' +
        `(<code>${rootDir}/${slug}/index.md</code> 파일을 추가하면 이곳에 표시됩니다.)</div>`;
      if (crumb) crumb.textContent = '준비 중';
    });
})();
