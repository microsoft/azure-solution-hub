# Microsoft Korea Solution Hub

**Microsoft Korea Solution Hub** 는 Microsoft 솔루션 설명 자료, 실습 워크샵, 신규 기능 소식을 한곳에서 제공하는 큐레이션 허브입니다.

🔗 **바로가기: <https://microsoft.github.io/azure-solution-hub/>**

---

## 무엇을 제공하나요

| 섹션 | 설명 |
| --- | --- |
| 🧩 **솔루션 설명 자료** | 시나리오별 Microsoft 솔루션 아키텍처와 도입 가이드 (폴더 기반, 마크다운 + 이미지) |
| 🧪 **실습 워크샵** | Infra · Data · AI Apps 카테고리별 핸즈온 워크샵. GitHub 저장소와 자동 연동 |
| ✨ **신규 기능** | 최신 제품·서비스 업데이트 소식 |

## 프로젝트 구조

```text
docs/                         # GitHub Pages 로 배포되는 정적 사이트
├─ index.html                 # 메인 랜딩 페이지
├─ solution.html              # 솔루션 상세 문서 뷰어 (마크다운 렌더링)
├─ workshops.md               # 워크샵 매니페스트 (편집 시 자동 반영)
├─ solutions/                 # 솔루션 설명 자료 (폴더 = 솔루션 1개)
│  ├─ solutions.md            # 솔루션 카드 매니페스트
│  ├─ _template/index.md      # 새 솔루션 작성용 템플릿
│  └─ cloud-migration/        # 예시 솔루션 (index.md + images/)
└─ assets/                    # CSS · JS · 이미지
.github/workflows/
└─ deploy-pages.yml           # main 브랜치 push 시 자동 배포
```

## 콘텐츠 추가하기

콘텐츠는 코드 수정 없이 **마크다운 파일 편집만으로** 사이트에 반영됩니다.

### 워크샵 추가

[docs/workshops.md](docs/workshops.md) 에 항목을 추가하면 메인 페이지 워크샵 섹션에 자동 반영됩니다. (카테고리별 최신 3개 노출, 나머지는 "더보기")

```markdown
## AI Apps Workshop

### 새 워크샵 제목 (배지1 / 배지2)
워크샵 한 줄 설명
실습 자료: https://github.com/owner/repo
```

### 솔루션 설명 자료 추가

> 폴더와 `index.md` 만 만들면 목록에는 나타나지 않습니다. GitHub Pages는 정적 호스팅이라 폴더 내용을 실시간으로 조회할 수 없어, 목록은 [solutions.md](docs/solutions/solutions.md) 매니페스트를 읽어 렌더링합니다. 아래 **2단계**를 모두 거쳐야 카드가 표시됩니다.

1. **콘텐츠 작성** — `docs/solutions/<슬러그>/` 폴더를 만들고 [_template/index.md](docs/solutions/_template/index.md) 를 참고해 `index.md` 를 작성합니다. (이미지는 `docs/solutions/<슬러그>/images/` 에 넣고 `![설명](images/파일명.png)` 으로 참조)
2. **목록 등록** — [docs/solutions/solutions.md](docs/solutions/solutions.md) 맨 아래에 카드 항목을 추가합니다.

```markdown
### 카드 제목
slug: 폴더-이름
tag: Azure
icon: cloud
카드에 보일 요약 한 문장.
```

- `slug` 는 폴더 이름과 **정확히 일치**해야 합니다. 카드 클릭 시 `solution.html?slug=<슬러그>` 상세 페이지로 연결됩니다.
- `icon` 은 `cloud | ai | security | data | modernwork | app` 중 하나입니다.
- 매니페스트를 편집하고 커밋하면 메인 페이지 "솔루션 설명 자료" 섹션에 자동으로 반영됩니다.

## 로컬에서 미리보기

```powershell
cd docs
python -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

## 배포

`main` 브랜치에 push 하면 [GitHub Actions 워크플로](.github/workflows/deploy-pages.yml)가 `docs/` 폴더를 자동으로 GitHub Pages에 배포합니다. 별도의 Pages 설정은 필요하지 않습니다.

## 지원

이슈 등록과 도움 요청 방법은 [SUPPORT.md](SUPPORT.md) 를, 보안 취약점 신고 절차는 [SECURITY.md](SECURITY.md) 를 참고하세요.

## 기여하기

이 프로젝트는 기여와 제안을 환영합니다. 대부분의 기여에는 기여자 라이선스 계약(CLA) 동의가 필요합니다. 자세한 내용은 [Contributor License Agreements](https://cla.opensource.microsoft.com) 를 참고하세요.

Pull Request를 제출하면 CLA 봇이 CLA 필요 여부를 자동으로 판단하고 PR에 상태를 표시합니다. 봇의 안내에 따르면 되며, CLA는 조직 전체에서 한 번만 동의하면 됩니다.

이 프로젝트는 [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/) 를 채택하고 있습니다. 자세한 내용은 [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) 를 참고하거나 추가 문의는 [opencode@microsoft.com](mailto:opencode@microsoft.com) 으로 연락해 주세요.

## 상표

이 프로젝트는 프로젝트, 제품, 서비스에 대한 상표나 로고를 포함할 수 있습니다. Microsoft 상표 및 로고의 사용은 [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general) 를 따라야 합니다. 수정된 버전에서 Microsoft 상표나 로고를 사용할 때 혼동을 일으키거나 Microsoft 후원을 암시해서는 안 됩니다. 제3자 상표나 로고의 사용은 해당 제3자의 정책을 따릅니다.
