# Microsoft Foundry Workshop (Code)
repo: https://github.com/Azure-Samples/foundry-agent-sdk-workshop-kr
metadata: {"schema_version":2,"managed_by":"azure-solution-hub/standardize-workshops","ref":"main","source_commit":"79d3f03e645f7189861bb09b15a40697690b644c","overview_source":"https://raw.githubusercontent.com/Azure-Samples/foundry-agent-sdk-workshop-kr/79d3f03e645f7189861bb09b15a40697690b644c/README.md","type":"workshop","title":"Microsoft Foundry Workshop (Code)","description":"Microsoft Foundry에서 Python으로 Chat Completions·Embeddings·RAG·에이전트를 구축하는 입문 핸즈온 (건강·피트니스 예제)","level":"beginner","authors":["Kyungtaak Noh"],"contacts":["@kyungtaak"],"duration_minutes":180,"tags":["foundry","azure-openai","rag","agent","ai-search"],"language":"ko","execution":["codespaces","local"],"status":"active","source":"localized: Azure/ai-foundry-workshop","last_updated":"2026-08-20","validated_on":"2026-08-12"}

> Microsoft Foundry에서 Python으로 Chat Completions·Embeddings·RAG·에이전트를 구축하는 입문 핸즈온 (건강·피트니스 예제)

이 워크샵은 **Microsoft Foundry**(구 Azure AI Foundry)를 기반으로 지능형 애플리케이션과 AI 에이전트를 구축하는 실습 중심의 과정을 제공합니다.
건강 및 식단 조언과 관련된 재미있는 예제를 통해 다음을 학습합니다:

- Microsoft Foundry의 기본 개념 이해
- Entra ID 기반 인증 및 프로젝트 설정 구성
- AI 모델 배포 및 테스트 (Chat Completions · Embeddings)
- Azure AI Search를 활용한 기본 RAG 구현
- Foundry Agent Service로 AI 에이전트 구축 (건강 조언 에이전트 예제)

> **소요 시간**: 약 3시간 · **난이도**: 입문
> **중점**: 실습 과제, 대화형 노트북, 실용적인 예제

## 01. 실습 환경 구성
source: https://raw.githubusercontent.com/Azure-Samples/foundry-agent-sdk-workshop-kr/79d3f03e645f7189861bb09b15a40697690b644c/01-setup/README.md
step: {"id":"01-setup/README.md","duration_minutes":15,"notebooks":[]}

## 02. Microsoft Foundry 프로젝트 구성
source: https://raw.githubusercontent.com/Azure-Samples/foundry-agent-sdk-workshop-kr/79d3f03e645f7189861bb09b15a40697690b644c/02-foundry-project/README.md
step: {"id":"02-foundry-project/README.md","duration_minutes":20,"notebooks":[]}

## 03. 인증 구성 (Entra ID + .env)
source: https://raw.githubusercontent.com/Azure-Samples/foundry-agent-sdk-workshop-kr/79d3f03e645f7189861bb09b15a40697690b644c/03-authentication/README.md
step: {"id":"03-authentication/README.md","duration_minutes":15,"notebooks":[]}

## 04. Chat Completion · Embeddings · RAG
source: https://raw.githubusercontent.com/Azure-Samples/foundry-agent-sdk-workshop-kr/79d3f03e645f7189861bb09b15a40697690b644c/04-chat-completion/README.md
step: {"id":"04-chat-completion/README.md","duration_minutes":90,"notebooks":["04-chat-completion/01-basic-chat-completion.ipynb","04-chat-completion/02-embeddings.ipynb","04-chat-completion/03-basic-rag.ipynb"]}

## 05. Foundry Agent Service 기초
source: https://raw.githubusercontent.com/Azure-Samples/foundry-agent-sdk-workshop-kr/79d3f03e645f7189861bb09b15a40697690b644c/05-agent-service/README.md
step: {"id":"05-agent-service/README.md","duration_minutes":40,"notebooks":["05-agent-service/01-agent-basics.ipynb"]}
