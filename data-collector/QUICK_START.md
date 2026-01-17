# Quick Start Guide - Testing Scrapers

## 🚀 Option A 완료: 실제 ASIN으로 테스트

실제 Amazon 제품 ASIN으로 스크래퍼를 테스트합니다.

### 📋 테스트 대상 제품

| 제품 | 브랜드 | ASIN | 상태 |
|------|--------|------|------|
| Water Sleeping Mask | LANEIGE | `B09HN8JBFP` | ✅ 검증됨 |
| Lip Sleeping Mask | LANEIGE | `B07XXPHQZK` | ✅ 검증됨 |
| Snail 96 Mucin Essence | COSRX | `B00PBX3L7K` | ✅ 검증됨 |
| Heartleaf 77 Toner | Anua | `B08CMS8P67` | ✅ 검증됨 |

### 📦 1. 설치

```bash
cd data-collector

# 패키지 설치
pip install -r requirements.txt

# Playwright 브라우저 설치
playwright install chromium
```

### 🧪 2. 테스트 실행

#### 빠른 테스트 (권장)
```bash
# 1개 제품으로 모든 스크래퍼 테스트 (약 2-3분 소요)
python test_scraper.py
```

**테스트 내용:**
- ✅ Product Scraper: 제품 상세 정보
- ✅ Review Scraper: 리뷰 10개 수집
- ✅ Rank Scraper: Best Sellers Top 20

#### 전체 파이프라인 테스트
```bash
# 모든 제품 + 모든 카테고리 수집 (약 10-15분 소요)
python main.py --mode scrape-only
```

### 📊 3. 결과 확인

테스트 실행 후 `data/` 폴더에 생성되는 파일:

```
data/
├── test_product.json       # 제품 상세 정보
├── test_reviews.json       # 리뷰 데이터
├── test_rankings.json      # 순위 데이터
└── logs/                   # 실행 로그
```

### ✅ 4. 성공 기준

다음 데이터가 모두 수집되면 성공:

- [x] 제품명, 브랜드, 가격
- [x] 평점, 리뷰 수
- [x] 카테고리 breadcrumb
- [x] 리뷰 텍스트 (최소 10개)
- [x] Best Sellers 순위

### ⚠️ 5. 문제 해결

#### "Browser not found" 에러
```bash
playwright install chromium
```

#### "Rate limit exceeded" 경고
→ 정상입니다. Rate limiter가 작동 중입니다. 3-5초 간격으로 자동 대기합니다.

#### "Product not found" 에러
→ ASIN이 올바른지 확인하거나, Amazon.com 접속 가능 여부 확인

#### 스크래핑이 너무 느림
→ `config/settings.py`에서 `SCRAPER_SETTINGS["delay_min"]`을 조정 (최소 3초 권장)

### 📈 다음 단계

테스트가 성공하면:

**Option B**: M1 데이터 프로세서 구축
- 변동성 지수 계산
- 트래픽 비율 추정
- M1 JSON 생성

**Option C**: M2 Claude API 분석기
- 리뷰 클러스터링
- 사용 맥락 추출
- M2 JSON 생성

**Option D**: 전체 통합 및 데모 데이터 생성
- 실제 demo data 포맷으로 변환
- 대시보드에 바로 사용 가능

---

## 🔍 상세 테스트 시나리오

### Test 1: 제품 스크래퍼
```python
# 단일 제품 테스트
from scrapers.product_scraper import ProductScraper
import asyncio

async def test():
    async with ProductScraper() as scraper:
        data = await scraper.scrape("B09HN8JBFP")
        print(data)

asyncio.run(test())
```

예상 결과:
```json
{
  "asin": "B09HN8JBFP",
  "brand": "LANEIGE",
  "product_name": "Water Sleeping Mask...",
  "price": {
    "current_price": 25.00,
    "currency": "USD"
  },
  "rating": 4.5,
  "review_count": 5234,
  "breadcrumb": "Beauty > Skin Care > Face > Moisturizers"
}
```

### Test 2: 리뷰 스크래퍼
```python
# 리뷰 수집 테스트
from scrapers.review_scraper import ReviewScraper
import asyncio

async def test():
    async with ReviewScraper() as scraper:
        reviews = await scraper.scrape("B09HN8JBFP", max_reviews=5)
        for r in reviews:
            print(f"{r['rating']}⭐: {r['text'][:100]}")

asyncio.run(test())
```

### Test 3: 순위 스크래퍼
```python
# Best Sellers 순위 테스트
from scrapers.rank_scraper import RankScraper
import asyncio

async def test():
    url = "https://www.amazon.com/Best-Sellers-Beauty-Facial-Moisturizers/zgbs/beauty/11060451"
    async with RankScraper() as scraper:
        rankings = await scraper.scrape(url, max_rank=10)
        for p in rankings:
            print(f"#{p['rank']}: {p['product_name']}")

asyncio.run(test())
```

---

## 📚 참고 자료

**Amazon 제품 ASIN 찾기:**
1. Amazon.com에서 제품 검색
2. URL 확인: `amazon.com/dp/[ASIN]/`
3. 또는 제품 상세 정보에서 "ASIN" 항목 확인

**Sources:**
- [LANEIGE Water Sleeping Mask on Amazon](https://www.amazon.com/LANEIGE-Water-Sleeping-Mask-Brighten/dp/B09HN8JBFP)
- [COSRX Snail Mucin on Amazon](https://www.amazon.com/COSRX-Repairing-Hydrating-Secretion-Phthalates/dp/B00PBX3L7K)
- [Anua Heartleaf Toner on Amazon](https://www.amazon.com/Heartleaf-Soothing-Trouble-Refreshing-Purifying/dp/B08CMS8P67)
- [LANEIGE Lip Sleeping Mask on Amazon](https://www.amazon.com/Laneige-Sleeping-Berry/dp/B07XXPHQZK)
