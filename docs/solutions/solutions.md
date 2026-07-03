<!--
  솔루션 설명 자료 목록 (매니페스트)
  ============================================================
  이 파일을 편집하면 메인 페이지의 "솔루션 설명 자료" 섹션이 자동으로 갱신됩니다.

  새 솔루션 추가 방법
  ------------------------------------------------------------
  1) solutions/<슬러그>/ 폴더를 만들고 그 안에 index.md 를 작성합니다.
     (이미지는 solutions/<슬러그>/images/ 에 넣고 index.md 에서
      ![설명](images/파일명.png) 형태로 참조합니다.)
  2) 아래에 항목을 추가합니다.

  형식
  ------------------------------------------------------------
  ### 카드 제목
  slug: 폴더-이름            → solutions/<slug>/index.md 를 가리킵니다.
  tag: 배지(Azure/AI/...)    → 카드 상단 배지
  icon: 아이콘 키            → cloud | ai | security | data | modernwork | app
  요약 문장                  → 카드 본문 설명

  · '#' 로 시작하거나 '<!-- -->' 로 감싼 줄은 주석으로 무시됩니다.
  · 카드를 클릭하면 solution.html?slug=<slug> 상세 페이지가 열립니다.
  ============================================================
-->

### 클라우드 마이그레이션
slug: cloud-migration
tag: Azure
icon: cloud
온프레미스 워크로드를 Azure로 안전하게 이전하는 단계별 아키텍처와 모범 사례를 제공합니다.

### Azure AI & Copilot
slug: azure-ai-copilot
tag: AI
icon: ai
Azure OpenAI와 Copilot을 활용한 지능형 애플리케이션 구축 시나리오와 레퍼런스 아키텍처.

### 보안 & 거버넌스
slug: security-governance
tag: Security
icon: security
Zero Trust 기반의 보안 아키텍처와 Microsoft Defender, Entra ID 통합 전략을 안내합니다.

### 데이터 & 애널리틱스
slug: data-analytics
tag: Data
icon: data
Microsoft Fabric과 Synapse를 활용한 통합 데이터 플랫폼 구성 및 분석 시나리오.

### Microsoft 365 & 협업
slug: microsoft-365
tag: Modern Work
icon: modernwork
Teams, SharePoint, Copilot for Microsoft 365 기반의 생산성 향상 솔루션.

### 앱 현대화 & DevOps
slug: app-modernization
tag: App Innovation
icon: app
컨테이너, Kubernetes, GitHub를 활용한 클라우드 네이티브 애플리케이션 현대화.

### Ontology Playground
slug: ontology
tag: Data
icon: data
온톨로지와 Microsoft Fabric IQ 개념을 인터랙티브 그래프·RDF 도구·실습형 학습 경로로 배우는 한국어 데모입니다.
