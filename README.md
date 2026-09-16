# Microsoft Korea Solution Hub

**Microsoft Korea Solution Hub** 는 Microsoft 솔루션 설명 자료, 실습 워크샵, 신규 기능 소식을 한곳에서 제공하는 큐레이션 허브입니다.

🔗 **바로가기: <https://microsoft.github.io/azure-solution-hub/>**

---

## 무엇을 제공하나요

| 섹션 | 설명 |
| --- | --- |
| 🧩 **솔루션 설명 자료** | 카테고리별 Microsoft 솔루션 아키텍처와 도입 가이드. **폴더(마크다운)** 또는 **외부 URL** 방식으로 등록 |
| 🧪 **실습 워크샵** | 핸즈온 워크샵. **GitHub 저장소 URL** 또는 **폴더(마크다운)** 방식으로 등록 |
| ✨ **신규 기능** | Azure 서비스 업데이트를 매일 자동 수집·한국어 번역. 날짜별로 보관되어 검색됩니다 |

- 좌측 **카테고리**(전체 + 분류) / 우측 **가로형 카드** 2단 레이아웃, 한 페이지 3개 + 하단 페이지네이션
- 상단 **검색창**으로 솔루션·워크샵·신규 기능을 통합 검색 (약어집 지원: `MS→Microsoft`, `VNet→Virtual Network` 등)

## 프로젝트 구조

```text
docs/                          # GitHub Pages 로 배포되는 정적 사이트
├─ index.html                  # 메인 랜딩 페이지
├─ solution.html               # 솔루션 상세 문서 뷰어
├─ workshop.html               # 워크샵 단계형 뷰어
├─ solutions/                  # 솔루션 설명 자료
│  ├─ solutions.md             # 솔루션 카드 매니페스트 (편집 시 자동 반영)
│  ├─ _template/index.md       # 새 솔루션 작성용 템플릿
│  └─ cloud-migration/         # 예시 솔루션 (index.md + images/)
├─ workshops/                  # 실습 워크샵
│  ├─ workshops.md             # 워크샵 매니페스트 (편집 시 자동 반영)
│  ├─ catalog.json             # 표준 리포 메타데이터 (자동 생성, 카드·검색 공용)
│  └─ _template/index.md       # 폴더형 워크샵 작성용 템플릿
├─ updates/                    # 신규 기능 업데이트 (자동 생성)
│  ├─ updates.json             # 최신 스냅샷 (사이트 표시용)
│  ├─ all.json                 # 누적 아카이브 (검색용)
│  └─ daily/YYYY-MM-DD.json    # 날짜별 스냅샷
└─ assets/
   ├─ css/ · img/
   └─ js/
      ├─ main.js               # 목록·검색 렌더링
      └─ search-synonyms.js    # 검색 약어집(동의어) — 여기만 편집하면 확장 검색 추가
.github/workflows/
├─ deploy-pages.yml            # main push 또는 표준화 성공 후 배포
├─ standardize-workshops.yml   # 공개 워크샵 수집·검사·생성·커밋
└─ update-feed.yml             # 매일 신규 기능 업데이트 수집
```

## 콘텐츠 추가하기

콘텐츠는 코드 수정 없이 **매니페스트(마크다운) 편집만으로** 사이트에 반영됩니다. 카테고리 기준은 솔루션·워크샵이 **동일**합니다: `클라우드 & 인프라` · `AI & 데이터` · `보안 & 거버넌스` · `모던 워크 & 협업` · `앱 혁신 & DevOps`.

### 솔루션 설명 자료 추가

[docs/solutions/solutions.md](docs/solutions/solutions.md) 매니페스트에 카드 항목을 추가합니다. 두 가지 방식 중 하나를 사용합니다.

**방식 A — 폴더 업로드 (마크다운 직접 작성)**

1. `docs/solutions/<슬러그>/` 폴더를 만들고 [_template/index.md](docs/solutions/_template/index.md) 를 참고해 `index.md` 를 작성합니다. (이미지는 `docs/solutions/<슬러그>/images/` 에 넣고 `![설명](images/파일명.png)` 으로 참조)
2. 매니페스트에 `slug` 항목을 추가합니다.

```markdown
### 카드 제목
slug: 폴더-이름                # 폴더 이름과 정확히 일치. 클릭 시 solution.html?slug=<슬러그>
category: AI & 데이터           # 좌측 카테고리 (없으면 tag 사용)
tag: AI                        # 카드 상단 배지
icon: ai                       # cloud | ai | security | data | modernwork | app
date: 2026-08-20 14:30         # 업데이트 일시(시간까지). 가장 최근 항목에 '최신' 배지
workshop: 워크샵 이름 | https://github.com/owner/repo   # (선택) 관련 워크샵, 최대 2개
카드에 보일 요약 한 문장.
```

**방식 B — URL 추가 (외부 링크 연결)**

폴더/파일 없이 외부에 게시된 자료를 바로 연결합니다. `slug` 대신 `url` 을 사용합니다.

```markdown
### 카드 제목
url: https://example.com/자료.html     # 클릭 시 새 탭으로 열림
category: AI & 데이터
tag: AI
icon: ai
date: 2026-08-20 09:30
카드에 보일 요약 한 문장.
```

> `slug` 또는 `url` 중 하나가 있어야 카드가 표시됩니다. `date` 는 시간까지 기록하되 카드에는 날짜만 표시되며, 전체에서 가장 최근 항목에 `최신` 배지가 붙습니다.

### 실습 워크샵 추가

[docs/workshops/workshops.md](docs/workshops/workshops.md) 매니페스트에 항목을 추가합니다. `## 카테고리` 아래에 워크샵을 나열하며, 솔루션과 동일한 카테고리 이름을 사용하세요.

**표준 공개 리포 연결 (권장)**

워크샵마다 별도 공개 GitHub 리포를 사용합니다. 실습 문서·노트북·이미지·실행 환경은 원본 리포에서 관리하고, 허브는 등재 여부·카테고리·slug·ref만 관리합니다.

```markdown
## AI & 데이터

### Microsoft Foundry Workshop (Code)
included: true
folder: foundry-agent-sdk-workshop-kr
ref: main
https://github.com/Azure-Samples/foundry-agent-sdk-workshop-kr
```

`folder`는 고정 URL 식별자입니다. 생략하면 리포 이름으로 생성하며, `ref`를 생략하면 원본 기본 브랜치를 사용합니다. 제목·설명·배지는 원본 frontmatter에서 읽습니다. 기존 URL 전용 항목과 수동 매니페스트도 계속 사용할 수 있습니다.

표준 리포의 입력 규칙은 다음과 같습니다.

- 루트 README에 `type: workshop`, `title`, `description`, `level`, `authors`, `contacts`, `duration_minutes`, `tags`, `language`, `execution`, `status`, `source`, `last_updated`, `validated_on`을 선언합니다. `validated_on` 키는 필수지만 값은 공란이어도 됩니다. 저자의 E2E 검증일이며 자동으로 채우지 않습니다.
- 루트의 `## 개요`와 `## 워크샵 학습 경로`가 필수입니다. 학습 경로 섹션 안의 모든 표를 순서대로 읽습니다. 링크는 `01-name/README.md` 또는 `labs/01-name/README.md` 형식의 리포 상대 경로여야 합니다.
- 각 랩 README에는 `title`, 양의 정수 `duration_minutes`, `last_updated`를 선언합니다. 분할형은 `## 학습 단계` 또는 `## 실습 단계`의 표에서 같은 폴더의 `01-name.md`를 순서대로 연결합니다. 하위 문서는 H1 하나를 사용하고 frontmatter를 반복하지 않습니다.
- 노트북은 랩 README에서 상대 링크로 연결합니다. 뷰어는 GitHub 노트북 화면으로 연결하며 직접 실행하지 않습니다. Codespaces 버튼은 `execution`에 `codespaces`가 있을 때 표시합니다.

생성 매니페스트의 `metadata:`는 JSON 한 줄이며 `schema_version: 2`, `managed_by`, `ref`, `source_commit`을 기록합니다. `step:`에는 문서 경로 기반 ID와 랩별 정보를 기록합니다. 본문은 해당 commit의 raw 문서에서 읽습니다. 카드·검색은 [docs/workshops/catalog.json](docs/workshops/catalog.json)을 함께 사용합니다. 검증일 미등록과 90일 초과를 구분해서 표시합니다.

```powershell
npm ci
npm test
npm run sync:workshops
```

수집기는 공개 여부·메타데이터·목차 링크를 검사한 뒤 파일을 기록합니다. 어느 리포에서든 검사에 실패하면 생성 파일을 쓰지 않고 종료합니다. 수동 매니페스트는 덮어쓰지 않으며, 동일한 원본을 다시 수집하면 파일 내용과 sitemap 날짜가 바뀌지 않습니다. 자동 생성 파일을 직접 편집하는 대신 원본 리포나 등재 항목을 수정하십시오.

**방식 A — URL 추가 (GitHub 저장소 링크)**

```markdown
## AI & 데이터

### 새 워크샵 제목 (배지1 / 배지2)
워크샵 한 줄 설명
https://github.com/owner/repo
라벨 : https://github.com/owner/other-repo    # (선택) 레포가 여러 개면 라벨이 링크 텍스트
```

- 설명을 비워 두면 GitHub 저장소 설명을 자동으로 가져옵니다.

**방식 B — 폴더 업로드 (마크다운 직접 작성)**

1. `docs/workshops/<슬러그>/` 폴더를 만들고 [_template/index.md](docs/workshops/_template/index.md) 를 참고해 `index.md` 를 작성합니다.
2. 워크샵 항목에 `folder` 줄을 추가합니다. (GitHub 링크를 함께 두면 상세 페이지 링크 + 레포 링크가 모두 표시됩니다.)

```markdown
### 폴더형 워크샵 제목 (배지)
folder: 폴더-이름              # 클릭 시 workshop.html?slug=<슬러그>
워크샵 한 줄 설명
```

### 신규 기능 업데이트 (자동)

`docs/updates/` 는 [update-feed.yml](.github/workflows/update-feed.yml) 워크플로가 **매일 자동 생성**합니다. 최신 스냅샷(`updates.json`), 날짜별 스냅샷(`daily/`), 누적 아카이브(`all.json`)를 만들며, 검색은 `all.json` 을 사용합니다. 수동 편집은 필요하지 않습니다.

## 로컬에서 미리보기

```powershell
# 방법 1: 라이브 리로드 (파일 저장 시 자동 새로고침)
npx --yes live-server docs --port=5500

# 방법 2: 파이썬 기본 서버
cd docs
python -m http.server 8080
```


## 배포

`main` 브랜치에 push 하면 [GitHub Actions 워크플로](.github/workflows/deploy-pages.yml)가 `docs/` 폴더를 자동으로 GitHub Pages에 배포합니다. 별도의 Pages 설정은 필요하지 않습니다.

워크샵 표준화는 기존처럼 별도 [워크플로](.github/workflows/standardize-workshops.yml)에서 생성 후 변경 파일을 커밋·push합니다. 목록·수집 코드 변경 시, 매주 월요일 01:00 UTC, 또는 수동 실행으로 수집합니다. Pages 워크플로는 생성 작업을 수행하지 않고, `main`의 표준화 실행이 성공하면 `workflow_run`으로 최신 `main`을 다시 배포합니다. 수집 실패 시 이 후속 배포는 실행하지 않습니다.

## 지원

이슈 등록과 도움 요청 방법은 [SUPPORT.md](SUPPORT.md) 를, 보안 취약점 신고 절차는 [SECURITY.md](SECURITY.md) 를 참고하세요.

## 기여하기

이 프로젝트는 기여와 제안을 환영합니다. 대부분의 기여에는 기여자 라이선스 계약(CLA) 동의가 필요합니다. 자세한 내용은 [Contributor License Agreements](https://cla.opensource.microsoft.com) 를 참고하세요.

Pull Request를 제출하면 CLA 봇이 CLA 필요 여부를 자동으로 판단하고 PR에 상태를 표시합니다. 봇의 안내에 따르면 되며, CLA는 조직 전체에서 한 번만 동의하면 됩니다.

이 프로젝트는 [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/) 를 채택하고 있습니다. 자세한 내용은 [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) 를 참고하거나 추가 문의는 [opencode@microsoft.com](mailto:opencode@microsoft.com) 으로 연락해 주세요.

## 상표

이 프로젝트는 프로젝트, 제품, 서비스에 대한 상표나 로고를 포함할 수 있습니다. Microsoft 상표 및 로고의 사용은 [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general) 를 따라야 합니다. 수정된 버전에서 Microsoft 상표나 로고를 사용할 때 혼동을 일으키거나 Microsoft 후원을 암시해서는 안 됩니다. 제3자 상표나 로고의 사용은 해당 제3자의 정책을 따릅니다.
