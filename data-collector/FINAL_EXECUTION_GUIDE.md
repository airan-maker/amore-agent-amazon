# 🎯 Final Execution Guide - Amazon Data Collector

## ✅ 전체 시스템 완성!

A → B → C → D 모든 단계가 완료되었습니다!

---

## 📦 최종 시스템 구조

```
Amazon 데이터 수집
      ↓
┌─────────────────────────────────────┐
│  STEP 1-4: Data Collection          │
│  - Product Details (Playwright)      │
│  - Best Sellers Rankings             │
│  - Customer Reviews                  │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  STEP 5: M1 Generation              │
│  - Breadcrumb Traffic Analysis       │
│  - Volatility Index Calculation      │
│  - Emerging Brands Detection         │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  STEP 6: M2 Generation (Claude API) │
│  - Usage Context Clustering          │
│  - Sentiment Analysis                │
│  - Intelligence Bridge               │
└─────────────────────────────────────┘
      ↓
   Demo Data JSON Files (5개)
```

---

## 🚀 실행 방법

### 1단계: 환경 설정

```bash
cd data-collector

# 패키지 설치
pip install -r requirements.txt

# Playwright 브라우저 설치
playwright install chromium

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집해서 ANTHROPIC_API_KEY 입력
```

### 2단계: Claude API Key 설정

`.env` 파일:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

💡 API Key 발급: https://console.anthropic.com/settings/keys

### 3단계: 실행

#### 옵션 1: 전체 파이프라인 (권장)
```bash
python main.py --mode full
```

**소요 시간**: 약 15-20분
- 데이터 수집: 10-15분
- M1 생성: 1분
- M2 분석 (Claude): 3-5분

#### 옵션 2: 단계별 실행

```bash
# Step 1: 스크래핑만
python main.py --mode scrape-only

# Step 2: 분석만 (이미 수집된 데이터 사용)
python main.py --mode analyze-only
```

#### 옵션 3: 빠른 테스트
```bash
# 1개 제품만 테스트
python test_scraper.py
```

---

## 📁 출력 파일

실행 완료 후 생성되는 파일들:

### Raw Data (data/ 폴더)
```
data/
├── products_20260101_120000.json    # 제품 상세 정보
├── ranks_20260101_120000.json       # 순위 데이터
└── reviews_20260101_120000.json     # 리뷰 데이터
```

### Demo Data (output/ 폴더) ⭐
```
output/
├── m1_breadcrumb_traffic.json      # M1-1: 카테고리별 트래픽
├── m1_volatility_index.json        # M1-2: 시장 변동성
├── m1_emerging_brands.json         # M1-3: 신흥 브랜드
├── m2_usage_context.json           # M2-1: 사용 맥락
└── m2_intelligence_bridge.json     # M2-2: 전략 인사이트
```

---

## 🎨 대시보드에 적용

생성된 JSON을 대시보드에서 바로 사용:

```bash
# 1. 생성된 파일 복사
cp output/*.json ../app/src/data/

# 2. 대시보드 재실행
cd ../app
npm run dev

# 3. 브라우저에서 확인
# http://localhost:5174
```

이제 **실제 Amazon 데이터**가 대시보드에 표시됩니다! 🎉

---

## ⚙️ 설정 커스터마이징

### 제품 추가/변경
`config/products.yaml` 파일 수정:
```yaml
target_products:
  - asin: "B09HN8JBFP"  # 원하는 ASIN으로 변경
    brand: "LANEIGE"
    product: "Water Sleeping Mask"
```

### 카테고리 추가
`config/categories.yaml` 파일 수정:
```yaml
related_categories:
  - name: "새로운 카테고리"
    best_sellers_url: "https://www.amazon.com/..."
    track_enabled: true
```

### API 설정 조정
`config/settings.py`:
```python
CLAUDE_SETTINGS = {
    "model": "claude-3-5-haiku-20241022",  # 또는 sonnet
    "max_tokens": 4096,
    "temperature": 0.3,
}

REVIEW_ANALYSIS = {
    "batch_size": 50,         # 한 번에 분석할 리뷰 수
    "max_reviews_per_product": 100,  # 제품당 수집 리뷰 수
}
```

---

## 💰 예상 비용

### Claude API (Haiku 기준)
- **입력**: $0.25 / million tokens
- **출력**: $1.25 / million tokens

**MVP 예상 비용 (4개 제품)**:
- 제품당 100 리뷰 = 400 리뷰
- 리뷰당 평균 200 tokens = 80K tokens
- 분석 출력 = 20K tokens
- **총 비용: 약 $0.05 - $0.10**

💡 실제 비용은 리뷰 길이와 수량에 따라 다릅니다.

---

## 🐛 문제 해결

### 1. "ANTHROPIC_API_KEY not set" 에러
→ `.env` 파일에 API Key 추가했는지 확인

### 2. "Browser not found" 에러
```bash
playwright install chromium
```

### 3. "Rate limit exceeded" 경고
→ 정상입니다. 자동으로 대기하고 재시도합니다.

### 4. Claude API 할당량 초과
→ API Key의 월 한도 확인 (https://console.anthropic.com/)

### 5. 스크래핑 차단됨
→ `config/settings.py`에서 `SCRAPER_SETTINGS["delay_min"]`을 5초로 증가

### 6. 특정 제품 스크래핑 실패
→ ASIN이 올바른지 확인
→ 해당 제품이 Amazon.com에 존재하는지 확인

---

## 📊 데이터 품질 검증

생성된 JSON 파일 확인:

```bash
# M1-1: Breadcrumb Traffic
# ✅ products 배열에 4개 제품
# ✅ 각 제품마다 exposure_paths 존재
# ✅ traffic_percentage 합계 ≈ 100%

# M2-1: Usage Context
# ✅ products 배열에 4개 제품
# ✅ 각 제품마다 usage_contexts 3-5개
# ✅ sample_reviews 포함
```

---

## 🔄 정기 실행 (추후)

데이터를 주기적으로 업데이트하려면:

### Option 1: Cron (Linux/Mac)
```bash
# 매주 월요일 오전 2시 실행
0 2 * * 1 cd /path/to/data-collector && python main.py --mode full
```

### Option 2: Task Scheduler (Windows)
작업 스케줄러에서 `python main.py --mode full` 등록

### Option 3: Python Scheduler (추가 구현 필요)
```python
# scheduler.py (향후 추가)
from apscheduler.schedulers.blocking import BlockingScheduler

scheduler = BlockingScheduler()
scheduler.add_job(run_pipeline, 'cron', day_of_week='mon', hour=2)
scheduler.start()
```

---

## 📈 확장 아이디어

현재 MVP를 기반으로 확장 가능:

1. **더 많은 제품**
   - `products.yaml`에 ASIN 추가

2. **더 많은 카테고리**
   - `categories.yaml`에 카테고리 추가

3. **시계열 추적**
   - 매일 실행해서 DB에 저장
   - 실제 트렌드 분석

4. **경쟁사 모니터링**
   - 경쟁 브랜드 ASIN 추가
   - 자동 벤치마킹

5. **프록시 추가**
   - 대량 수집 시 IP 차단 방지

6. **PostgreSQL 전환**
   - SQLite → PostgreSQL
   - 더 큰 데이터 관리

---

## ✅ 최종 체크리스트

실행 전 확인:

- [ ] Python 3.8+ 설치됨
- [ ] pip install -r requirements.txt 완료
- [ ] playwright install chromium 완료
- [ ] .env 파일에 ANTHROPIC_API_KEY 설정
- [ ] config/products.yaml에 실제 ASIN 입력
- [ ] 인터넷 연결 확인

실행:
- [ ] python main.py --mode full
- [ ] 에러 없이 완료
- [ ] output/ 폴더에 5개 JSON 생성

대시보드 연동:
- [ ] JSON 파일 app/src/data/로 복사
- [ ] 대시보드 재실행
- [ ] 실제 데이터 표시 확인

---

## 🎉 완성!

이제 Amazon에서 실제 데이터를 수집하고,
Claude API로 분석하여,
대시보드에서 시각화하는
**완전한 시스템**이 구축되었습니다!

**Sources:**
- [LANEIGE Water Sleeping Mask on Amazon](https://www.amazon.com/LANEIGE-Water-Sleeping-Mask-Brighten/dp/B09HN8JBFP)
- [COSRX Snail Mucin on Amazon](https://www.amazon.com/COSRX-Repairing-Hydrating-Secretion-Phthalates/dp/B00PBX3L7K)
- [Anua Heartleaf Toner on Amazon](https://www.amazon.com/Heartleaf-Soothing-Trouble-Refreshing-Purifying/dp/B08CMS8P67)
- [LANEIGE Lip Sleeping Mask on Amazon](https://www.amazon.com/Laneige-Sleeping-Berry/dp/B07XXPHQZK)
