<!--
  솔루션 설명 자료 목록 (매니페스트)
  ============================================================
  이 파일을 편집하면 메인 페이지의 "솔루션 설명 자료" 섹션이 자동으로 갱신됩니다.

  솔루션 설명 자료는 두 가지 방식으로 추가할 수 있습니다.

  [방식 A] 폴더 업로드 방식 (Markdown 직접 작성)
  ------------------------------------------------------------
  1) solutions/<슬러그>/ 폴더를 만들고 그 안에 index.md 를 작성합니다.
     (이미지는 solutions/<슬러그>/images/ 에 넣고 index.md 에서
      ![설명](images/파일명.png) 형태로 참조합니다.)
  2) 아래에 slug 항목을 추가합니다.

  ### 카드 제목
  slug: 폴더-이름            → solutions/<slug>/index.md 를 가리킵니다.
  category: 카테고리 이름    → 왼쪽 카테고리 목록의 분류 (없으면 tag 사용)
  tag: 배지(Azure/AI/...)    → 카드 상단 배지
  tags: 태그1, 태그2, 태그3   → 필터/태그 정보(쉼표 구분). 상단 "태그" 드롭다운과
                              대표 태그 칩, 카드 태그로 표시됩니다.
  icon: 아이콘 키            → cloud | ai | security | data | modernwork | app
  date: 2026-08-20 14:30     → 업데이트 일시(시간까지 기록). 카드에는 날짜만 표시.
  요약 문장                  → 카드 본문 설명

  · 카드를 클릭하면 solution.html?slug=<slug> 상세 페이지가 열립니다.

  [방식 B] URL 추가 방식 (외부 링크 연결)
  ------------------------------------------------------------
  폴더/파일 업로드 없이 외부에 게시된 자료(원페이지, 문서 등)를
  URL 로 바로 연결합니다. slug 대신 url 항목을 사용합니다.

  ### 카드 제목
  url: https://example.com/자료.html   → 클릭 시 새 탭으로 열립니다.
  category: 카테고리 이름    → 왼쪽 카테고리 목록의 분류 (없으면 tag 사용)
  tag: 배지(Azure/AI/...)    → 카드 상단 배지
  icon: 아이콘 키            → cloud | ai | security | data | modernwork | app
  date: 2026-08-20 14:30     → 업데이트 일시(시간까지 기록). 카드에는 날짜만 표시.
  요약 문장                  → 카드 본문 설명

  공통
  ------------------------------------------------------------
  · '#' 로 시작하거나 '<!-- -->' 로 감싼 줄은 주석으로 무시됩니다.
  · slug 또는 url 중 하나가 있어야 카드가 표시됩니다.
    (둘 다 있으면 slug 방식이 우선합니다.)
  · 왼쪽은 category 기준으로 그룹화되고, 오른쪽은 카테고리별 카드가 표시됩니다.
    (전체 선택 시 섹션 이름은 '전체', 전체 리스트를 최신순으로 표시)
  · 한 화면에 최대 3행까지 표시하고, 그 이상은 하단 페이지 네비게이션으로 이동합니다.
  · date 는 시간까지 기록하며, 전체에서 가장 최근 항목에 '최신' 배지가 붙습니다.

  관련 워크샵 (선택, 최대 2개)
  ------------------------------------------------------------
  각 솔루션에 관련 워크샵을 최대 2개까지 연결할 수 있습니다.
  카드 오른쪽 '워크샵 바로가기' 영역에 버튼으로 표시되며, 없으면 표시되지 않습니다.

  workshop: 워크샵 이름 | https://github.com/...   → 이름과 링크(| 구분)
  workshop: https://github.com/...                     → 이름 생략 시 URL 표시
  ============================================================
-->

### 클라우드 마이그레이션
slug: cloud-migration
category: 클라우드 & 인프라
tag: Azure
tags: Azure, Migration, Landing Zone, Infra
icon: cloud
date: 2026-06-12 09:00
workshop: Azure Basic Workshop | https://github.com/Azure-Samples/AzureBasicWorkshop
workshop: Azure Landing Zone Workshop | https://github.com/Azure-Samples/AzureLandingZoneWorkshop
온프레미스 워크로드를 Azure로 안전하게 이전하는 단계별 아키텍처와 모범 사례를 제공합니다.

### Azure AI & Copilot
slug: azure-ai-copilot
category: AI & 데이터
tag: AI
tags: AI, Azure OpenAI, Copilot, RAG
icon: ai
date: 2026-07-01 10:30
workshop: Azure AI Foundry Workshop (Portal) | https://github.com/Anna-Jeong-MS/AzureAIFoundryWorkshop
workshop: Azure AI Foundry Workshop (Code) | https://github.com/Anna-Jeong-MS/AzureAIFoundryWorkshop-Code
Azure OpenAI와 Copilot을 활용한 지능형 애플리케이션 구축 시나리오와 레퍼런스 아키텍처.

### 보안 & 거버넌스
slug: security-governance
category: 보안 & 거버넌스
tag: Security
tags: Security, Zero Trust, Entra ID, Defender
icon: security
date: 2026-05-20 14:00
Zero Trust 기반의 보안 아키텍처와 Microsoft Defender, Entra ID 통합 전략을 안내합니다.

### 데이터 & 애널리틱스
slug: data-analytics
category: AI & 데이터
tag: Data
tags: Data, Fabric, Synapse, Analytics
icon: data
date: 2026-06-28 11:15
workshop: Microsoft Fabric Camp | https://github.com/jiyongseong/microsoft-fabric-camp/tree/main/microsoft-fabric-in-a-day
workshop: CosmosBulkDemo | https://github.com/yujeny/CosmosBulkDemo
Microsoft Fabric과 Synapse를 활용한 통합 데이터 플랫폼 구성 및 분석 시나리오.

### Microsoft 365 & 협업
slug: microsoft-365
category: 모던 워크 & 협업
tag: Modern Work
tags: Microsoft 365, Teams, Copilot, Collaboration
icon: modernwork
date: 2026-04-15 16:00
Teams, SharePoint, Copilot for Microsoft 365 기반의 생산성 향상 솔루션.

### 앱 현대화 & DevOps
slug: app-modernization
category: 앱 혁신 & DevOps
tag: App Innovation
tags: App Innovation, Kubernetes, DevOps, GitHub
icon: app
date: 2026-07-10 13:45
workshop: AKS Basic Workshop | https://github.com/Azure-Samples/AKSBasicWorkshop
workshop: GitHub Copilot Workshop | https://github.com/taeyo-kim/MyDemo
컨테이너, Kubernetes, GitHub를 활용한 클라우드 네이티브 애플리케이션 현대화.

### Ontology Playground
slug: ontology
category: AI & 데이터
tag: Data
tags: Data, Ontology, Fabric, RDF
icon: data
date: 2026-08-18 10:00
온톨로지와 Microsoft Fabric IQ 개념을 인터랙티브 그래프·RDF 도구·실습형 학습 경로로 배우는 한국어 데모입니다.

<!-- ── URL 추가 방식 (외부 링크) ─────────────────────────── -->

### Why Build AI on Azure? — 원페이지
url: https://hijigoo.github.io/why-build-ai-on-azure/why-build-ai-on-azure-onepage.html
category: AI & 데이터
tag: AI
tags: AI, Azure OpenAI, Architecture
icon: ai
date: 2026-08-20 09:30
workshop: Azure AI Foundry Workshop | https://github.com/Anna-Jeong-MS/AzureAIFoundryWorkshop
Azure에서 AI를 구축해야 하는 이유를 한 페이지로 정리한 원페이지 요약 자료.

### Microsoft Foundry 네트워크 격리
url: https://hijigoo.github.io/why-build-ai-on-azure/samples/foundry-network-isolation/foundry-network-isolation.html
category: 보안 & 거버넌스
tag: Security
tags: Security, Microsoft Foundry, Network
icon: security
date: 2026-08-19 17:20
사설 경계(Private Boundary) 안에서 에이전트를 안전하게 운영하는 Microsoft Foundry 네트워크 격리 가이드.
