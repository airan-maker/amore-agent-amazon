# 자동 스케줄러 사용 가이드

## 개요

이 시스템은 매일 정해진 시간에 자동으로 다음 작업을 수행합니다:

1. ✅ Amazon 데이터 수집 (제품, 리뷰, 랭킹)
2. ✅ M1/M2 데이터 생성 (AI 분석)
3. ✅ 수집된 데이터를 프론트엔드로 자동 복사
4. ✅ 백업 생성 및 로그 기록

---

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
cd data-collector
pip install -r requirements.txt
```

### 2. 스케줄 시간 설정

`data-collector/config/scheduler_config.yaml` 파일을 편집:

```yaml
schedule:
  # 매일 실행 시간 (24시간 형식)
  daily_run_time: "03:00"  # 매일 새벽 3시

  # 시간대
  timezone: "Asia/Seoul"

  # 실행 모드 (full: 전체, scrape-only: 스크래핑만)
  execution_mode: "full"
```

### 3. 스케줄러 실행

#### Windows:
```bash
# 배치 파일로 실행 (권장)
cd data-collector
start_scheduler.bat

# 또는 Python으로 직접 실행
python run_scheduler.py
```

#### Linux/Mac:
```bash
cd data-collector
python run_scheduler.py
```

### 4. 백그라운드 실행 (Windows)

스케줄러를 백그라운드에서 계속 실행하려면:

```bash
# 숨김 모드로 실행
pythonw run_scheduler.py
```

또는 Windows 작업 스케줄러에 등록 (아래 섹션 참조)

---

## ⚙️ 설정 상세

### scheduler_config.yaml 주요 설정

#### 1. 스케줄 설정
```yaml
schedule:
  daily_run_time: "03:00"      # 실행 시간 (HH:MM 형식)
  timezone: "Asia/Seoul"       # 시간대
  execution_mode: "full"       # full | scrape-only
```

**사용 가능한 시간대:**
- `Asia/Seoul` (한국)
- `America/New_York` (미국 동부)
- `Europe/London` (영국)
- `Asia/Tokyo` (일본)

#### 2. 데이터 복사 설정
```yaml
data_copy:
  enabled: true                # 자동 복사 활성화
  create_backup: true          # 기존 파일 백업
  backup_suffix: "_backup"     # 백업 파일 접미사
```

#### 3. 재시도 설정
```yaml
retry:
  max_attempts: 3              # 최대 재시도 횟수
  retry_interval: 10           # 재시도 간격 (분)
  retry_on_failure: true       # 실패 시 재시도
```

#### 4. 성능 설정
```yaml
performance:
  run_on_startup: false        # 시작 시 즉시 실행
  coalesce: true               # 중복 실행 방지
  max_execution_time: 3600     # 최대 실행 시간 (초)
```

#### 5. 개발 모드 (테스트용)
```yaml
development:
  enabled: false               # 개발 모드 활성화
  test_interval_minutes: 5     # 테스트 실행 간격 (분)
```

**개발 모드 사용법:**
```bash
# 5분마다 실행 (테스트용)
# scheduler_config.yaml에서 development.enabled: true로 설정 후
python run_scheduler.py
```

---

## 📁 파일 구조

```
data-collector/
├── scheduler.py                    # 메인 스케줄러 (자동 실행 로직)
├── run_scheduler.py                # 실행 진입점
├── start_scheduler.bat             # Windows 실행 스크립트
│
├── config/
│   └── scheduler_config.yaml       # 스케줄 설정 파일
│
├── utils/
│   └── data_copier.py              # 데이터 복사 유틸리티
│
├── logs/
│   └── scheduler_*.log             # 스케줄러 로그
│
├── output/                         # 수집된 데이터 (자동 생성)
│   ├── test_5_categories_*.json
│   ├── m1_*.json
│   └── m2_*.json
│
└── data/                           # Raw 데이터 (자동 생성)
    ├── products_*.json
    ├── ranks_*.json
    └── reviews_*.json
```

---

## 📊 자동화 플로우

```
┌─────────────────────────────────────────────────┐
│  1. 스케줄러 시작 (run_scheduler.py)           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  2. 설정된 시간 대기 (예: 매일 03:00)          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  3. 데이터 수집 파이프라인 실행                │
│     • Product Scraper (제품 정보)              │
│     • Rank Scraper (베스트셀러 순위)           │
│     • Review Scraper (리뷰)                    │
│     • M1 Generator (시장 분석)                 │
│     • M2 Generator (리뷰 인텔리전스)           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  4. 데이터 저장                                │
│     • data-collector/data/*.json (Raw)         │
│     • data-collector/output/*.json (Processed) │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  5. 자동 데이터 복사 (DataCopier)              │
│     • output/*.json → app/src/data/*.json      │
│     • 기존 파일 백업 생성                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  6. 완료 로그 기록 & 다음 실행 대기            │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Windows 작업 스케줄러 등록 (권장)

스케줄러를 Windows 서비스처럼 항상 백그라운드에서 실행하려면:

### 1. 작업 스케줄러 열기
- `Win + R` → `taskschd.msc` 입력 → 엔터

### 2. 새 작업 만들기
- **이름**: `Amazon Data Collector Scheduler`
- **설명**: `매일 자동 데이터 수집 및 프론트엔드 업데이트`

### 3. 트리거 설정
- **시작**: 시스템 시작 시
- **지연 시간**: 1분

### 4. 작업 설정
- **프로그램**: `pythonw.exe` (숨김 모드)
- **인수**: `run_scheduler.py`
- **시작 위치**: `C:\Users\RAN\Downloads\amore_agent_amazon\data-collector`

### 5. 조건 설정
- ✅ "전원에 연결된 경우에만 작업 시작" 해제
- ✅ "절전 모드일 때 작업을 시작하지 않음" 해제

### 6. 저장 및 확인
- 작업 스케줄러에서 상태 확인
- 로그 파일 확인: `data-collector/logs/scheduler_*.log`

---

## 📝 로그 확인

### 로그 파일 위치
```
data-collector/logs/
├── scheduler_2024-01-15.log       # 스케줄러 로그
├── collector_2024-01-15.log       # 데이터 수집 로그
└── product_details_*.log          # 세부 스크래핑 로그
```

### 로그 내용 예시
```
2024-01-15 03:00:00 | INFO     | scheduler - 🚀 Starting Scheduled Data Collection
2024-01-15 03:00:05 | INFO     | main - [STEP 1/6] Collecting product details...
2024-01-15 03:05:30 | SUCCESS  | main - ✓ Product B09HN8JBFP scraped successfully
...
2024-01-15 03:45:00 | INFO     | data_copier - ✓ Copied: test_5_categories_20240115.json → category_products.json
2024-01-15 03:45:05 | SUCCESS  | scheduler - 🎉 SCHEDULED TASK COMPLETED SUCCESSFULLY!
```

### 로그 레벨 변경
`config/scheduler_config.yaml`:
```yaml
logging:
  level: "DEBUG"  # DEBUG | INFO | WARNING | ERROR
```

---

## 🔧 문제 해결

### 1. 스케줄러가 시작되지 않음
```bash
# 의존성 재설치
pip install -r requirements.txt --force-reinstall

# Python 버전 확인 (3.8 이상 필요)
python --version
```

### 2. 데이터 수집 실패
```bash
# .env 파일에 API 키 확인
cat data-collector/.env
# ANTHROPIC_API_KEY=sk-ant-...

# 수동 실행으로 테스트
cd data-collector
python main.py --mode full
```

### 3. 데이터 복사 실패
```bash
# 수동으로 데이터 복사 테스트
cd data-collector
python utils/data_copier.py

# 프론트엔드 데이터 폴더 권한 확인
ls -la ../app/src/data/
```

### 4. 로그 확인
```bash
# 최신 스케줄러 로그 보기
tail -f data-collector/logs/scheduler_*.log

# 에러만 필터링
grep ERROR data-collector/logs/scheduler_*.log
```

---

## 🎯 사용 시나리오

### 시나리오 1: 매일 새벽 3시 자동 실행
```yaml
# scheduler_config.yaml
schedule:
  daily_run_time: "03:00"
  timezone: "Asia/Seoul"
  execution_mode: "full"

performance:
  run_on_startup: false  # 시작 시 즉시 실행 안 함
```

**실행:**
```bash
cd data-collector
python run_scheduler.py
# 또는 Windows 작업 스케줄러에 등록
```

### 시나리오 2: 테스트 모드 (5분마다 실행)
```yaml
# scheduler_config.yaml
development:
  enabled: true
  test_interval_minutes: 5
```

**실행:**
```bash
cd data-collector
python run_scheduler.py
# 5분마다 데이터 수집 실행 (테스트용)
```

### 시나리오 3: 즉시 한 번만 실행 후 스케줄링
```yaml
# scheduler_config.yaml
performance:
  run_on_startup: true  # 시작 시 즉시 실행
```

**실행:**
```bash
cd data-collector
python run_scheduler.py
# 즉시 데이터 수집 실행 후, 다음날 03:00부터 스케줄링
```

---

## 📊 모니터링

### 실행 상태 확인
```bash
# 로그 실시간 모니터링
tail -f data-collector/logs/scheduler_*.log

# 마지막 실행 결과 확인
grep "COMPLETED" data-collector/logs/scheduler_*.log | tail -1

# 에러 확인
grep "ERROR" data-collector/logs/scheduler_*.log | tail -10
```

### 수집된 데이터 확인
```bash
# 최신 수집 데이터 확인
ls -lht data-collector/output/*.json | head -5

# 프론트엔드에 복사된 데이터 확인
ls -lht app/src/data/*.json
```

---

## 🚨 주의사항

1. **스케줄러는 계속 실행 상태를 유지해야 합니다**
   - Windows 작업 스케줄러 등록 권장
   - 또는 `pythonw run_scheduler.py`로 백그라운드 실행

2. **API 키 확인**
   - `.env` 파일에 `ANTHROPIC_API_KEY` 필수
   - M2 모듈 생성에 사용

3. **디스크 공간**
   - 백업 파일이 계속 쌓이므로 주기적으로 정리 필요
   - 로그 파일은 30일 후 자동 삭제 (설정 가능)

4. **Amazon 요청 제한**
   - 너무 자주 실행하면 IP 차단 위험
   - 하루 1회 실행 권장

---

## 📞 도움말

### 수동 데이터 수집 (긴급 시)
```bash
cd data-collector
python main.py --mode full
```

### 데이터만 복사 (재배포 시)
```bash
cd data-collector
python utils/data_copier.py
```

### 스케줄러 중지
- `Ctrl + C` (터미널에서 실행 중인 경우)
- Windows 작업 스케줄러에서 작업 비활성화

---

## 🎉 완료!

이제 스케줄러가 매일 자동으로 데이터를 수집하고 프론트엔드를 업데이트합니다.

**확인 방법:**
1. 로그 확인: `data-collector/logs/scheduler_*.log`
2. 데이터 확인: `app/src/data/*.json`
3. 대시보드 확인: `cd app && npm run dev`

문제가 발생하면 로그 파일을 확인하고 필요 시 수동 실행으로 테스트하세요.
