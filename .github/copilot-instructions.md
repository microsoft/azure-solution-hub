# Copilot 작업 지침 — azure-solution-hub

정적 사이트입니다. 배포 대상은 `docs/` 폴더이며 GitHub Pages(라이브: `https://microsoft.github.io/azure-solution-hub/`)로 서빙됩니다.

## 분석 스크립트 (필수)

`docs/` 하위에 **새 HTML 페이지를 추가할 때는 반드시** 아래 두 스크립트를 `<head>`에 포함해야 합니다. 하나는 Microsoft Clarity, 다른 하나는 Google Analytics 4(GA4)입니다. 순서는 Clarity → GA4로 통일합니다.

```html
<!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "xi4b8iz65c");
</script>

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-HT8WWZQ8V4"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-HT8WWZQ8V4');
</script>
```

- Clarity 프로젝트 ID: `xi4b8iz65c`
- GA4 측정 ID: `G-HT8WWZQ8V4`
- 즉시 리다이렉트만 하는 페이지(예: 루트 `index.html`)에는 넣지 않습니다. 실제 콘텐츠 페이지에만 적용합니다.
- 빌드 산출물(예: `docs/solutions/ontology/demo/`)을 재생성하면 스니펫이 사라질 수 있으니, 재빌드 후 다시 삽입되었는지 확인합니다.

현재 스니펫이 적용된 페이지: `docs/index.html`, `docs/solution.html`, `docs/solutions/ontology/demo/index.html`, `docs/privacy/index.html`.

## SEO / GEO 파일 (페이지 추가·변경 시 갱신 필수)

페이지를 추가/삭제하거나 URL 구조가 바뀌면 아래 파일을 **함께 업데이트**합니다. 정식 URL은 라이브 호스트 `https://microsoft.github.io/azure-solution-hub/`를 기준으로 절대경로를 사용합니다.

- `docs/sitemap.xml` — 새 페이지의 `<url>` 항목 추가/수정, 해당 항목의 `<lastmod>`를 갱신일로.
- `docs/llms.txt` — 사이트 개요 및 주요 페이지 링크 목록(생성형 엔진 최적화, GEO)을 최신 상태로.
- `docs/robots.txt` — `Sitemap:` 항목 및 크롤 규칙 확인.
- 새 개인정보/분석 관련 변경 시 `docs/privacy/index.html`(Privacy Notice)도 함께 검토합니다.

솔루션 URL 형식은 `solution.html?slug=<slug>`이며, 솔루션 목록은 `docs/solutions/solutions.md` 매니페스트에서 관리됩니다. 새 솔루션을 추가하면 sitemap.xml과 llms.txt에도 해당 URL을 반영합니다.

## 배포

`feat/ontology-solution` 브랜치의 `docs/` 변경을 push하면 GitHub Pages(레거시 브랜치 배포, 소스 `/docs`)가 자동 재배포합니다.
