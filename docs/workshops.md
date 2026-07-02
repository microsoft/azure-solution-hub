<!--
  실습 워크샵 목록
  ============================================================
  이 파일을 편집하면 메인 페이지의 "실습 워크샵" 섹션이 자동으로 갱신됩니다.

  형식
  ------------------------------------------------------------
  ## 카테고리 이름                → 워크샵 그룹(섹션) 제목
  ### 워크샵 제목 (배지1 / 배지2)  → 개별 워크샵. 괄호 안 값은 배지로 표시됩니다.
  설명 문장                       → 카드 본문 설명 (여러 줄 가능, 자동으로 합쳐짐)
  https://github.com/owner/repo   → 레포 링크 (한 줄에 하나)
  라벨 : https://github.com/...    → 여러 레포가 있을 때 라벨이 링크 텍스트가 됩니다.

  · 설명을 비워 두면 GitHub 레포의 설명을 자동으로 가져옵니다.
  · '#' 로 시작하거나 '<!-- -->' 로 감싼 줄은 주석으로 무시됩니다.
  ============================================================
-->

## Infra Workshop

### Azure Basic Workshop (L200 / 4시간)
이론 세션: Compute, Network, Storage, Security 서비스 소개. 실습 세션: 로드 밸런서, 가상 머신, SQL 데이터베이스(프라이빗 엔드포인트)를 활용한 웹 애플리케이션 구성.
https://github.com/Azure-Samples/AzureBasicWorkshop

### Azure Landing Zone Workshop (L200~300 / 4시간)
이론 세션: Azure Landing Zone 소개. 실습 세션: Hub-Spoke 기반의 Application Gateway(WAF v2) – Firewall – VM 기반 랜딩존 구성.
https://github.com/Azure-Samples/AzureLandingZoneWorkshop

### AKS Basic Workshop (L200~300 / 4시간)
이론 세션: AKS(Azure Kubernetes Service) 소개. 실습 세션: AKS 구성 및 샘플 애플리케이션 구성.
https://github.com/Azure-Samples/AKSBasicWorkshop


## Data Workshop

### Microsoft Fabric Camp
Microsoft Fabric 전반을 하루 안에 익힐 수 있도록 구성된 핸즈온 워크샵입니다. 데이터 수집·변환, Lakehouse, Warehouse, 보고서 시각화까지 Fabric의 엔드-투-엔드 기능을 실습 중심으로 경험하며, 단계별 랩 지침을 따라 데이터 파이프라인 구축부터 분석·리포트 생성까지 학습할 수 있습니다.
https://github.com/jiyongseong/microsoft-fabric-camp/tree/main/microsoft-fabric-in-a-day

### CosmosBulkDemo — Azure Cosmos DB 대량처리 실습
.NET SDK로 Cosmos DB에 데이터를 대량 삽입하고 TTL과 RU(Request Unit) 사용량을 모니터링하는 실습 예제입니다. PowerShell 스크립트로 리소스를 자동 생성하고 콘솔 앱으로 데이터를 주입한 뒤 Azure CLI로 메트릭을 확인하도록 구성되어 있습니다.
https://github.com/yujeny/CosmosBulkDemo


## AI Apps Workshop

### Azure AI Foundry Workshop (Portal / L200 / 4시간)
Azure AI Foundry를 기반으로 데이터 업로드, 임베딩, 챗봇 생성 등 핵심 기능을 직접 실습하며 AI 에이전트 개발 전 과정을 경험합니다. Semantic Kernel과 AutoGen을 활용한 다중 에이전트 연동, 모니터링, RAG 아키텍처 확장 등 실무 시나리오를 단계적으로 학습할 수 있습니다.
https://github.com/Anna-Jeong-MS/AzureAIFoundryWorkshop

### Azure AI Foundry Workshop (Code / L200 / 4시간)
Azure AI Foundry Workshop 실습을 위한 코드 저장소로, Python 3.10 기반 노트북 환경에서 인증 설정부터 Chat Completion & RAG, 에이전트 개발까지 순서대로 따라갈 수 있도록 구성되어 있습니다.
https://github.com/Anna-Jeong-MS/AzureAIFoundryWorkshop-Code

### Azure AI Gateway 기반 RAG 검색 시스템 구축
Azure AI Search와 Azure OpenAI를 활용해 벡터 검색, 하이브리드 검색, RAG 기반 AI 검색 시스템을 직접 구현하는 핸즈온 워크샵입니다. 리소스 생성부터 모델 배포, 검색 아키텍처 구현까지 단계별 실습으로 AI 기반 검색 서비스 구축 전 과정을 학습합니다.
https://github.com/ChangJu-Ahn/Azure-AI-Gateway-KR

### Observe, Manage, and Scale Agentic AI Apps with Microsoft Foundry
Microsoft Foundry를 활용해 Agentic AI 애플리케이션을 구축하고, 에이전트 실행 상태를 관찰(Observe)·운영 관리(Manage)·엔터프라이즈 환경 확장(Scale)하는 방법을 실습 중심으로 다룹니다. 에이전트 오케스트레이션, 모니터링, 운영 자동화 관점의 실제 아키텍처와 Best Practice를 학습합니다.
https://github.com/haew0nsh1n/ignite25-kor-observe-manage-and-scale-agentic-ai-apps-with-microsoft-foundry

### GitHub Copilot Workshop
GitHub Copilot, MCP 서버, 에이전트, GitHub CLI 등을 실습하기 위한 데모 코드와 시나리오 모음입니다. C#, Python, HTML/JS 등 다양한 언어의 샘플이 포함되어 코드 생성, 함수 확장, 자동화 플로우, 코드 리뷰 흐름, MCP 서버 연동 등을 테스트할 수 있습니다.
https://github.com/taeyo-kim/MyDemo

### GitHub Copilot Vibe Coding Workshop
GitHub Copilot을 활용한 Vibe Coding 실습 모음입니다. Python 기초부터 Agent 개발, 스펙 주도 개발(SDD), 미니 해커톤까지 단계별로 경험할 수 있습니다.
Python 기초 : https://github.com/HakjunMIN/python-workshop
Microsoft Agent Framework 기반 Agent 개발 : https://github.com/HakjunMIN/vibe-coding
스펙 주도 개발(SDD) 뱅킹앱 : https://github.com/HakjunMIN/SDD-banking-app
미니 해커톤 (Realtime Audio + MCP) : https://github.com/HakjunMIN/mcp-realtime-chainlit

### GenAIOps Workshop
GenAIOps 전반을 다루는 실습 모음으로, RAG 평가 자동화부터 Observability, Vector Search 최적화, 파이프라이닝까지 학습할 수 있습니다.
RAG E2E Evaluation 자동화 : https://github.com/HakjunMIN/e2e-rag-evaluation
Observability 강화 Ops : https://github.com/Azure-Samples/contoso-creative-writer
Vector Search RAG 최적화 : https://github.com/HakjunMIN/rag-optimizing-sample
GenAIOps Pipelining : https://github.com/HakjunMIN/llmops-content

### Microsoft Agent Framework Workshop
Microsoft Agent Framework(MAF)를 기반으로 한 노트북 핸즈온 워크샵입니다. 기본 개념부터 멀티에이전트 딥리서치까지 실습할 수 있습니다.
MAF 기본 핸즈온 : https://github.com/HakjunMIN/maf-workshop
멀티에이전트 딥리서치 핸즈온 : https://github.com/HakjunMIN/deep-research-MAF

### Azure OpenAI Basic Workshop
노트북 기반 Azure OpenAI 기초 핸즈온 워크샵으로, Semantic Kernel과 AutoGen 워크샵을 함께 제공합니다.
Azure OpenAI 기초 핸즈온 : https://github.com/HakjunMIN/azure-ai-workshop
Semantic Kernel 워크샵 : https://github.com/HakjunMIN/sk-workshop
Autogen 워크샵 : https://github.com/HakjunMIN/autogen4-sample

### Azure Serverless Workshop
가상의 IoT 디바이스 텔레메트리를 Azure Event Hub → Azure Functions → Azure Cosmos DB 순으로 처리하는 이벤트 기반 서버리스 아키텍처를 구축합니다. Azure API Management와 Application Insights를 포함한 엔드-투-엔드 실습을 제공하며, 인프라는 Terraform(OpenTofu 호환) 코드로 자동화되어 약 10분 내에 배포할 수 있습니다.
https://github.com/heegene-msft/azure-serverless-handson

### MS Agent Framework Hands-on Lab
Chat Agent, Tools & Functions, Multi-Agent Orchestration, MCP 등 핵심 개념과 SK/AutoGen과의 차이, Agentic Design Pattern(Reflection, Plan-and-Execute, Multi-Agent Collaboration) 구현 예시를 다룹니다. Azure OpenAI, Azure AI Search, Bing Grounding, Azure Evaluation SDK, Azure AI Foundry Agent Service 통합 예시를 포함합니다.
Repo : https://github.com/Azure/agent-innovator-lab
Basic Concepts of MS Agent Framework : https://github.com/Azure/agent-innovator-lab/blob/main/0_basic-agent/AgentFramework/1_basic-concept-with-msaf.ipynb
Reflection / Plan & Execute / Multi-Agent Pattern : https://github.com/Azure/agent-innovator-lab/tree/main/1_agentic-design-ptn
