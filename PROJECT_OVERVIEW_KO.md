# AMORE Agent Amazon - 프로젝트 개요

## 1. 아이디어 요약 (50자 이내)

**AI 기반 Amazon 시장분석 자동화 에이전트**

Amazon 제품 데이터를 자동 수집하고 AI로 분석하여 시장 인사이트를 제공하는 자동화 시스템

---

## 2. Agent 제안 배경 및 기대효과

### 2.1 배경 (Background)

#### 문제점
현대 이커머스 시장에서 데이터 기반 의사결정이 필수적이지만, 다음과 같은 한계가 존재합니다:

1. **수동 데이터 수집의 비효율성**
   - Amazon 베스트셀러, 제품 리뷰, 랭킹 변동을 수작업으로 추적
   - 시간 소모적이고 일관성 없는 데이터 수집
   - 실시간 트렌드 파악 어려움

2. **데이터 분석의 복잡성**
   - 방대한 리뷰 데이터에서 의미 있는 인사이트 도출 어려움
   - 경쟁사 분석 및 시장 변동성 추적 수동 작업
   - 브랜드별, 카테고리별 심층 분석 부재

3. **의사결정 지연**
   - 데이터 수집부터 분석까지 소요 시간 과다
   - 빠르게 변하는 시장 트렌드 대응 지연
   - 전략적 의사결정에 필요한 실시간 정보 부족

#### 핵심 인사이트
- **자동화의 필요성**: 매일 정해진 시간에 자동으로 데이터를 수집하면 일관성과 신뢰성 확보
- **AI 활용**: Claude AI를 통해 리뷰 분석, 사용 맥락 파악, 인텔리전스 브릿지 생성 자동화
- **시각화의 중요성**: 복잡한 데이터를 직관적인 대시보드로 제공하여 즉각적인 인사이트 도출

### 2.2 기대효과 (Expected Benefits)

#### 비즈니스 측면
1. **시간 절감 90% 이상**
   - 수동 데이터 수집 시간: 하루 3-4시간 → 자동화 후: 0시간
   - 분석 시간: 하루 2-3시간 → AI 분석 후: 10분 이내

2. **의사결정 속도 향상**
   - 매일 새벽 3시 자동 수집 → 아침 출근 시 최신 데이터 확인 가능
   - 실시간 트렌드 파악으로 빠른 전략 수정

3. **데이터 품질 향상**
   - 일관된 수집 프로세스로 데이터 신뢰성 확보
   - 히스토리컬 데이터 축적으로 트렌드 분석 가능

#### 기술적 측면
1. **확장 가능한 아키텍처**
   - 모듈식 설계로 새로운 데이터 소스 추가 용이
   - 멀티 마켓플레이스(Amazon US, JP, UK 등) 확장 가능

2. **AI 인사이트 자동 생성**
   - 리뷰 감성 분석 및 주요 키워드 추출
   - 사용 맥락(Usage Context) 자동 파악
   - 경쟁사 대비 포지셔닝 분석

3. **데이터 시각화**
   - 실시간 대시보드로 KPI 모니터링
   - 카테고리별, 브랜드별 성과 비교
   - 트렌드 차트 및 예측 분석

#### 전략적 측면
1. **시장 트렌드 선제 대응**
   - 신흥 브랜드(Emerging Brands) 조기 발견
   - 시장 변동성(Volatility Index) 모니터링
   - 카테고리 트래픽 추정으로 기회 시장 파악

2. **경쟁 우위 확보**
   - 데이터 기반 제품 기획 및 마케팅 전략
   - 리뷰 인사이트 기반 제품 개선
   - 가격 및 포지셔닝 최적화

---

## 3. 기능 및 구조

### 3.1 주요 기능

#### M0: 자동화 스케줄러
- **매일 정해진 시간 자동 실행** (기본: 새벽 3시)
- **데이터 수집 → AI 분석 → 프론트엔드 배포** 전체 파이프라인 자동화
- **재시도 로직**: 실패 시 최대 3회 재시도 (10분 간격)
- **백업 생성**: 기존 데이터 자동 백업 후 업데이트
- **로그 기록**: 모든 실행 이력 및 에러 추적

**기술 스택:**
- APScheduler (Python 스케줄링)
- AsyncIO (비동기 실행)
- YAML 기반 설정 관리

#### M1: 시장 분석 모듈 (Market Analysis)

**M1-1: 브레드크럼 트래픽 분석**
- Amazon 카테고리별 예상 트래픽 추정
- 브레드크럼 네비게이션 기반 카테고리 구조 파악
- 시장 크기 및 기회 영역 식별

**M1-2: 변동성 지수 (Volatility Index)**
- 카테고리별 제품 순위 변동성 측정
- 안정적 시장 vs 역동적 시장 구분
- 진입 난이도 평가

**M1-3: 신흥 브랜드 (Emerging Brands)**
- 랭킹 상승률 기반 떠오르는 브랜드 탐지
- 브랜드별 성장 추이 분석
- 경쟁 환경 모니터링

#### M2: AI 리뷰 인텔리전스 (Review Intelligence)

**M2-1: 사용 맥락 분석 (Usage Context)**
- Claude AI를 활용한 리뷰 자동 분석
- 제품별 주요 사용 시나리오 추출
- 고객 니즈 및 페인포인트 파악

**M2-2: 인텔리전스 브릿지 (Intelligence Bridge)**
- AI 기반 제품별 핵심 인사이트 요약
- 경쟁 우위 요소 및 개선 포인트 도출
- 마케팅 메시지 제안

#### M3: 대시보드 및 시각화

**주요 화면:**
1. **AI Agent Dashboard**
   - 전체 KPI 한눈에 보기
   - M1/M2 모듈 통합 뷰
   - 실시간 데이터 업데이트

2. **Product Catalog**
   - 카테고리별 제품 목록
   - 필터링 및 정렬 기능
   - 상세 제품 정보 및 리뷰

3. **Laneige AI Agent**
   - 브랜드별 맞춤 분석
   - 경쟁사 비교 분석
   - 시장 포지셔닝

**시각화 컴포넌트:**
- Recharts 기반 차트 (라인, 바, 파이)
- 반응형 디자인 (모바일 지원)
- Excel 내보내기 기능

### 3.2 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    SCHEDULER (M0)                           │
│               매일 새벽 3시 자동 실행                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA COLLECTION PIPELINE                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Product    │  │    Rank      │  │   Review     │     │
│  │   Scraper    │  │   Scraper    │  │   Scraper    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │             │
│         └─────────────────┴─────────────────┘             │
│                           │                               │
│                           ▼                               │
│              ┌─────────────────────────┐                  │
│              │   Raw Data Storage      │                  │
│              │   data/*.json           │                  │
│              └──────────┬──────────────┘                  │
└─────────────────────────┼──────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 M1/M2 GENERATOR                             │
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────┐     │
│  │  M1: Market Analysis│      │ M2: Review Intel    │     │
│  │  - Breadcrumb       │      │ - Usage Context     │     │
│  │  - Volatility       │      │ - Intelligence      │     │
│  │  - Emerging Brands  │      │   Bridge (Claude AI)│     │
│  └──────────┬──────────┘      └──────────┬──────────┘     │
│             │                            │                │
│             └────────────┬───────────────┘                │
│                          ▼                                │
│              ┌─────────────────────────┐                  │
│              │  Processed Data         │                  │
│              │  output/*.json          │                  │
│              └──────────┬──────────────┘                  │
└─────────────────────────┼──────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA COPIER                               │
│            output/*.json → app/src/data/*.json              │
│            (백업 생성 + 자동 복사)                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                FRONTEND DASHBOARD                           │
│                   (React + Vite)                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AI Agent     │  │  Product     │  │  Laneige     │     │
│  │ Dashboard    │  │  Catalog     │  │  AI Agent    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 데이터 플로우

```
1. COLLECTION (수집)
   Amazon Website
        ↓ (Playwright Scraping)
   Raw JSON Data
        ↓
   data/products_*.json
   data/ranks_*.json
   data/reviews_*.json

2. PROCESSING (처리)
   M1 Generator
        ↓ (시장 분석 알고리즘)
   m1_breadcrumb_traffic.json
   m1_volatility_index.json
   m1_emerging_brands.json

   M2 Generator
        ↓ (Claude AI 분석)
   m2_usage_context.json
   m2_intelligence_bridge.json

3. INTEGRATION (통합)
   Data Aggregator
        ↓ (카테고리별 통합)
   test_5_categories_*.json

4. DEPLOYMENT (배포)
   Data Copier
        ↓ (자동 복사 + 백업)
   app/src/data/*.json

5. VISUALIZATION (시각화)
   React Dashboard
        ↓ (사용자 인터페이스)
   실시간 인사이트
```

### 3.4 기술 스택

#### Backend (Data Collector)
- **Python 3.9+**
- **Playwright**: 브라우저 자동화 (Amazon 스크래핑)
- **BeautifulSoup4**: HTML 파싱
- **Anthropic Claude API**: AI 리뷰 분석
- **APScheduler**: 자동 스케줄링
- **Loguru**: 로깅
- **PyYAML**: 설정 관리

#### Frontend (Dashboard)
- **React 18**: UI 프레임워크
- **Vite**: 빌드 도구
- **Recharts**: 데이터 시각화
- **Tailwind CSS**: 스타일링
- **Lucide Icons**: 아이콘

#### Infrastructure
- **Git/GitHub**: 버전 관리 (Private Repository)
- **Windows Task Scheduler**: 프로덕션 스케줄링
- **JSON**: 데이터 저장 포맷

---

## 4. 개발 구현 과정

### 4.1 Phase 1: 수동 데이터 수집 시스템 (초기 버전)

#### 구현 내용
- Amazon 제품 스크래핑 기본 기능
- 카테고리별 베스트셀러 수집
- 리뷰 크롤링 (제목, 본문, 평점)

#### 한계
- 매번 수동으로 `python main.py --mode full` 실행 필요
- 데이터 복사도 수동 (`python utils/data_copier.py`)
- 일관성 없는 수집 시간

### 4.2 Phase 2: 자동화 스케줄러 도입 (현재 버전)

#### 개발 단계

**Step 1: 스케줄러 설계**
- APScheduler 라이브러리 선택 (크론 대비 Python 네이티브)
- 매일 새벽 3시 실행으로 설정 (트래픽 적고 안정적)
- AsyncIO 기반 비동기 실행으로 성능 최적화

**Step 2: 설정 파일 시스템**
```yaml
# scheduler_config.yaml
schedule:
  daily_run_time: "03:00"
  timezone: "Asia/Seoul"
  execution_mode: "full"

retry:
  max_attempts: 3
  retry_interval: 10

data_copy:
  enabled: true
  file_mappings:
    - source_pattern: "test_5_categories_*.json"
      destination: "category_products.json"
      use_latest: true
```

**Step 3: 데이터 복사 자동화**
- `DataCopier` 클래스 구현
- 백업 생성 기능 (덮어쓰기 전 `_backup` 파일 생성)
- 파일 검증 로직 (필수 파일 누락 체크)

**Step 4: 에러 핸들링 및 로깅**
- 재시도 로직: 실패 시 10분 후 재시도 (최대 3회)
- 상세 로그 기록: `logs/scheduler_*.log`
- 실패 알림: 에러 발생 시 로그에 명확한 메시지

**Step 5: Windows 통합**
- `start_scheduler.bat` 배치 파일 생성
- Windows Task Scheduler 등록 가이드 작성
- `pythonw.exe` 활용한 백그라운드 실행

### 4.3 Phase 3: Demo Data Generation

#### 배경
2026-01-02, 2026-01-03은 자동화가 아직 실행되지 않아 데이터가 없는 상태

#### 구현
- `generate_demo_data.py` 스크립트 개발
- 기존 데이터(2026-01-01)를 기반으로 리얼리스틱한 변동 적용
  - 리뷰 수: -1% ~ +10% 변동
  - 평점: ±0.1 범위 변동
  - 순위: ±3 위치 변동
- 타임스탬프를 해당 날짜로 조정 (3시경)

```python
# 예시: 리뷰 수 변동 로직
change = random.uniform(-variance * 0.2, variance * 2)  # -1% to +10%
new_count = int(review_count * (1 + change))
modified_product["review_count"] = max(new_count, review_count)
```

### 4.4 Phase 4: GitHub 통합

#### Private Repository 생성
- Repository: `https://github.com/airan-maker/amore-agent-amazon`
- 모노레포 구조: `data-collector/` + `app/` 통합

#### 보안 설정
- `.gitignore` 생성
  - `.env` 파일 제외 (ANTHROPIC_API_KEY 보호)
  - `data/*.json`, `output/*.json` 제외 (대용량 데이터)
  - `logs/*.log` 제외
  - `node_modules/`, `dist/` 제외

#### Git 워크플로우
```bash
# 초기 커밋
git init
git add .
git commit -m "Initial commit: Automated Amazon data collection system"

# GitHub 연결
git remote add origin https://github.com/airan-maker/amore-agent-amazon.git
git push -u origin master
```

#### Personal Access Token 인증
- GitHub Password 인증 deprecated (2021년 이후)
- PAT 생성: Settings → Developer settings → Tokens
- Scope: `repo` (전체 private repository 접근)

### 4.5 개발 도구 및 환경

#### IDE
- VS Code
- Python Extension
- ESLint (JavaScript)

#### 테스트 환경
- Windows 11
- Python 3.9.13
- Node.js 18.x

#### 개발 모드
```yaml
# scheduler_config.yaml
development:
  enabled: true
  test_interval_minutes: 5  # 5분마다 실행 (테스트용)
```

---

## 5. Agent의 추후 확장 방향성

### 5.1 단기 확장 (3-6개월)

#### 1. 멀티 마켓플레이스 지원
**목표**: Amazon US 외 추가 마켓 데이터 수집

**구현 계획:**
- Amazon JP (일본): 아시아 시장 트렌드
- Amazon UK (영국): 유럽 시장 진출
- Amazon DE (독일): 유럽 최대 시장

**기술적 고려사항:**
- 언어별 리뷰 분석 (Claude AI 다국어 지원)
- 통화 변환 및 가격 비교
- 국가별 카테고리 구조 차이 처리

#### 2. 실시간 알림 시스템
**목표**: 중요 이벤트 발생 시 즉시 알림

**알림 트리거:**
- 급격한 순위 변동 (±10위 이상)
- 신흥 브랜드 진입
- 리뷰 평점 급락 (경쟁사 모니터링)
- 카테고리 변동성 급증

**알림 채널:**
- 이메일
- Slack 통합
- 웹 푸시 알림

#### 3. 고급 AI 분석
**목표**: Claude AI 활용 심화

**확장 기능:**
- **감성 분석**: 리뷰 긍정/부정/중립 분류
- **키워드 트렌드**: 시간별 키워드 변화 추적
- **경쟁사 비교**: 제품 간 강점/약점 자동 분석
- **예측 모델**: 랭킹 변동 예측

### 5.2 중기 확장 (6-12개월)

#### 1. 데이터베이스 마이그레이션
**목표**: JSON → PostgreSQL/MongoDB

**이점:**
- 빠른 쿼리 성능
- 복잡한 분석 쿼리 지원
- 데이터 무결성 보장
- 스케일링 용이

**마이그레이션 전략:**
- 점진적 전환 (JSON과 DB 병행)
- 백업 및 롤백 계획
- 데이터 검증 자동화

#### 2. API 서버 구축
**목표**: REST API로 데이터 제공

**API 엔드포인트 예시:**
```
GET /api/products?category=skincare
GET /api/rankings?date=2026-01-01
GET /api/reviews/{product_id}
GET /api/insights/m1/volatility
GET /api/insights/m2/usage-context
```

**기술 스택:**
- FastAPI (Python)
- JWT 인증
- Rate Limiting
- API 문서 (Swagger)

#### 3. 머신러닝 통합
**목표**: 예측 분석 및 추천 시스템

**ML 모델:**
- **랭킹 예측 모델**: 제품 순위 변동 예측
- **가격 최적화**: 판매량 극대화 가격 제안
- **리뷰 요약**: 수천 개 리뷰를 3-5문장으로 요약
- **추천 시스템**: 유사 제품 및 기회 상품 추천

**기술:**
- Scikit-learn, TensorFlow
- BERT 기반 NLP
- Time Series Analysis

### 5.3 장기 확장 (12개월 이상)

#### 1. 통합 이커머스 인텔리전스 플랫폼
**목표**: Amazon 외 플랫폼 통합

**확장 플랫폼:**
- Coupang (쿠팡)
- 11번가
- G마켓/옥션
- 네이버 쇼핑

**통합 대시보드:**
- 크로스 플랫폼 성과 비교
- 플랫폼별 최적 전략 제안
- 통합 재고 및 가격 관리

#### 2. 자동화 마케팅 연동
**목표**: 데이터 → 액션 자동화

**자동화 시나리오:**
- 순위 하락 시 광고 입찰가 자동 조정
- 리뷰 부정 키워드 감지 시 고객 서비스 알림
- 경쟁사 가격 변동 시 자동 가격 매칭
- 신제품 출시 타이밍 AI 추천

**연동 시스템:**
- Amazon Advertising API
- Google Ads
- 이메일 마케팅 플랫폼

#### 3. 엔터프라이즈 SaaS 전환
**목표**: 다중 고객 지원 SaaS 플랫폼

**기능:**
- 멀티 테넌트 아키텍처
- 고객별 대시보드 커스터마이징
- 팀 협업 기능 (역할 기반 권한)
- 화이트 라벨링

**수익 모델:**
- 월간 구독 (Tier별 기능 차등)
- 데이터 사용량 기반 과금
- 엔터프라이즈 맞춤 계약

#### 4. AI Agent 진화
**목표**: 완전 자율 AI 에이전트

**미래 비전:**
- **자가 학습**: 사용자 행동 학습 후 맞춤 인사이트
- **자동 의사결정**: 사전 정의된 룰에 따라 자동 액션
- **대화형 인터페이스**: 챗봇으로 질문 → AI가 데이터 분석 후 답변
  - "이번 달 베스트셀러 추이는?"
  - "경쟁사 대비 우리 제품 포지션은?"
  - "다음 주 출시하기 좋은 카테고리는?"

**기술:**
- Claude 3+ (고급 추론)
- Function Calling (자동 데이터 조회)
- Agentic Workflow (복잡한 태스크 자동 분해)

### 5.4 확장 로드맵 요약

```
┌───────────────────────────────────────────────────────────┐
│ Q1-Q2 2026: 단기                                          │
│ • 멀티 마켓플레이스 (JP, UK, DE)                          │
│ • 실시간 알림 시스템                                       │
│ • 고급 AI 분석 (감성, 예측)                               │
└───────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│ Q3-Q4 2026: 중기                                          │
│ • 데이터베이스 마이그레이션 (PostgreSQL)                   │
│ • REST API 서버 구축                                      │
│ • ML 모델 통합 (랭킹 예측, 리뷰 요약)                     │
└───────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│ 2027+: 장기                                               │
│ • 통합 이커머스 플랫폼 (Coupang, 11번가 등)                │
│ • 자동화 마케팅 연동                                       │
│ • 엔터프라이즈 SaaS 전환                                  │
│ • 완전 자율 AI Agent                                      │
└───────────────────────────────────────────────────────────┘
```

---

## 부록: 핵심 파일 가이드

### 실행 파일
- `data-collector/run_scheduler.py`: 스케줄러 실행 진입점
- `data-collector/start_scheduler.bat`: Windows 배치 파일
- `data-collector/main.py`: 수동 데이터 수집 (테스트용)

### 설정 파일
- `data-collector/config/scheduler_config.yaml`: 스케줄 설정
- `data-collector/.env`: API 키 (Git 제외)
- `.gitignore`: Git 업로드 제외 파일

### 문서
- `SCHEDULER_GUIDE.md`: 스케줄러 상세 사용법 (한글)
- `README.md`: 프로젝트 개요 (영문)
- `PROJECT_OVERVIEW_KO.md`: 프로젝트 개요 (한글) - 본 문서

### 로그 및 데이터
- `data-collector/logs/scheduler_*.log`: 실행 로그
- `data-collector/data/*.json`: Raw 데이터
- `data-collector/output/*.json`: 처리된 데이터
- `app/src/data/*.json`: 프론트엔드 데이터

---

## 문의 및 지원

**개발자**: airan@airanlab.com
**Repository**: https://github.com/airan-maker/amore-agent-amazon (Private)

---

**문서 버전**: 1.0.0
**최종 수정일**: 2026-01-03
