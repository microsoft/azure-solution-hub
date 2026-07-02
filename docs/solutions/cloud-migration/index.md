# 클라우드 마이그레이션

> 온프레미스 워크로드를 Azure로 안전하고 체계적으로 이전하기 위한 단계별 아키텍처와 모범 사례를 제공합니다.

| 항목 | 내용 |
| --- | --- |
| 카테고리 | Azure |
| 난이도 | L200 ~ L300 |
| 대상 | 인프라 담당자 · 클라우드 아키텍트 |
| 관련 서비스 | Azure Migrate, Azure VM, Azure SQL, Azure Backup |

---

## 개요

많은 조직이 하드웨어 노후화, 데이터센터 운영 비용, 확장성 한계로 인해 클라우드 전환을 검토합니다.
Azure 클라우드 마이그레이션은 단순한 "Lift & Shift"를 넘어, 워크로드 특성에 맞는 최적의 이전 전략(**5R**: Rehost, Refactor, Rearchitect, Rebuild, Replace)을 선택하는 것에서 시작합니다.

본 솔루션은 **평가 → 설계 → 마이그레이션 → 최적화**의 4단계 프레임워크를 기반으로,
Azure Migrate를 활용해 현행 환경을 자동으로 분석하고, 마이그레이션 후 비용과 성능을 최적화하는 방법을 안내합니다.

## 아키텍처

![클라우드 마이그레이션 아키텍처](images/architecture.svg)

온프레미스 환경을 Azure Migrate로 검색·평가한 뒤, 검증된 워크로드를 Azure의 가상 머신, 관리형 데이터베이스, 스토리지로 이전합니다.
이전된 리소스는 Hub-Spoke 네트워크와 Azure Backup, Azure Monitor를 통해 보호·관제됩니다.

## 주요 구성 요소

- **Azure Migrate** — 서버·데이터베이스·웹앱을 검색하고 종속성 및 비용을 평가하는 허브 서비스
- **Azure Virtual Machines** — Rehost(Lift & Shift) 대상 워크로드를 위한 IaaS 컴퓨팅
- **Azure SQL Managed Instance** — 최소 변경으로 온프레미스 SQL Server를 이전하는 관리형 데이터베이스
- **Azure Backup & Site Recovery** — 마이그레이션 중/후의 데이터 보호와 재해 복구
- **Azure Monitor & Cost Management** — 이전 후 성능 관제 및 비용 최적화

## 마이그레이션 전략 (5R)

| 전략 | 설명 | 적합한 경우 |
| --- | --- | --- |
| **Rehost** | 변경 없이 그대로 이전 (Lift & Shift) | 빠른 이전이 필요한 레거시 워크로드 |
| **Refactor** | 약간의 수정으로 PaaS 활용 | 관리형 서비스로 운영 부담 감소 |
| **Rearchitect** | 클라우드 네이티브로 재설계 | 확장성·탄력성이 중요한 앱 |
| **Rebuild** | 처음부터 다시 구축 | 기존 앱이 요구사항을 못 맞출 때 |
| **Replace** | SaaS로 대체 | 표준 기능을 SaaS가 충족할 때 |

## 도입 단계

1. **평가(Assess)** — Azure Migrate로 서버 검색, 종속성 분석, TCO/성능 기반 크기 산정
2. **설계(Design)** — 랜딩 존, 네트워크(Hub-Spoke), 보안, 명명 규칙 정의
3. **마이그레이션(Migrate)** — 파일럿 이전 → 검증 → 대규모 이전 (Azure Migrate/Site Recovery)
4. **최적화(Optimize)** — 리소스 크기 재조정, 예약 인스턴스 적용, 모니터링 및 거버넌스

## 기대 효과

- 데이터센터 운영 비용 절감 및 CapEx → OpEx 전환
- 탄력적 확장으로 수요 변화에 신속 대응
- 내장 보안·백업·재해 복구로 가용성과 규정 준수 강화

## 참고 자료

- [Azure Migrate 설명서](https://learn.microsoft.com/ko-kr/azure/migrate/)
- [클라우드 채택 프레임워크(CAF) — 마이그레이션](https://learn.microsoft.com/ko-kr/azure/cloud-adoption-framework/migrate/)
- [Azure 아키텍처 센터](https://learn.microsoft.com/ko-kr/azure/architecture/)

---

_카테고리: Azure · 최종 업데이트: 2026-07-02_
