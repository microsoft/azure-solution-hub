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

## 워크샵 표준화 (included: true)

실습 워크샵은 `docs/workshops/workshops.md` 매니페스트에서 관리하며, 단계형 뷰어(`workshop.html?slug=<slug>`)로 표시됩니다. 워크샵 항목에 **`included: true`** 마커가 있으면, 해당 워크샵을 사이트 공통 단계형 포맷으로 **표준화**해야 합니다. 표준화 절차(레포 단계 폴더 → `docs/workshops/<slug>/index.md` 매니페스트 생성 → `folder:` 연결 → SEO 갱신)는 `.github/skills/workshop-standardization/SKILL.md` 스킬을 따릅니다. 워크샵 매니페스트 형식의 기준은 `docs/workshops/_template/index.md` 입니다.

## 배포

`main` 브랜치에 push하면 `deploy-pages.yml`이 `docs/`를 GitHub Pages에 배포합니다. 표준화 워크플로는 기존처럼 생성 결과를 커밋·push하며, `main`에서 성공하면 Pages의 `workflow_run`이 최신 `main`을 배포합니다. Pages에서 수집기를 다시 실행하지 않습니다.

워크샵 변경 시 `npm ci`, `npm test`, `npm run sync:workshops`로 검사합니다. `metadata.managed_by`가 `azure-solution-hub/standardize-workshops`인 매니페스트와 `docs/workshops/catalog.json`은 자동 생성 대상입니다. 수동 매니페스트는 보호하며, 원본 문서·이미지·노트북을 허브에 복제하지 않습니다. `validated_on`은 저자가 기록한 값을 유지합니다.
