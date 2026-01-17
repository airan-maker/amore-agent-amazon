# Amazon 5개 카테고리 스크래핑 가이드

## 개요

Amazon Beauty & Personal Care 카테고리에서 5개 주요 카테고리의 Best Sellers 데이터를 수집하는 시스템입니다.

### 타겟 카테고리

1. **Beauty & Personal Care** (메인 카테고리)
2. **Lip Care Products** (립 케어)
3. **Skin Care Products** (스킨 케어)
4. **Lip Makeup** (립 메이크업)
5. **Face Powder** (페이스 파우더)

## 주요 기능

### 1. 스크롤 기반 동적 로딩
- Amazon Best Sellers 페이지의 스크롤 방식 제품 로딩 지원
- 각 페이지당 50개 제품 수집 가능
- 자동 중복 제거 기능

### 2. 페이지네이션 지원
- 기존 페이지네이션 방식도 지원 (pg 파라미터)
- `use_scroll` 옵션으로 방식 선택 가능

### 3. 수집 데이터
각 제품별로 다음 정보를 수집합니다:
- Rank (순위)
- ASIN (제품 ID)
- Product Name (제품명)
- Price (가격)
- Rating (평점)
- Review Count (리뷰 수)
- Product URL (제품 링크)
- Scraped Timestamp (수집 시간)

## 파일 구조

```
data-collector/
├── config/
│   └── categories.yaml          # 5개 카테고리 설정
├── scrapers/
│   ├── base_scraper.py
│   └── rank_scraper.py          # 스크롤 기능 추가됨
├── main.py                      # 메인 파이프라인 (업데이트됨)
├── test_5_categories.py         # 테스트 스크립트 (신규)
└── README_5_CATEGORIES.md       # 이 파일
```

## 설정 파일 (categories.yaml)

```yaml
primary_category:
  name: "Beauty & Personal Care"
  best_sellers_url: "https://www.amazon.com/Best-Sellers-Beauty-Personal-Care/zgbs/beauty/..."
  track_top_n: 100

related_categories:
  - name: "Lip Care Products"
    best_sellers_url: "https://www.amazon.com/Best-Sellers-..."
    track_enabled: true
    track_top_n: 100
  # ... (나머지 카테고리)
```

## 사용 방법

### 1. 테스트 스크립트 실행

5개 카테고리 모두 테스트:
```bash
cd data-collector
python test_5_categories.py --mode all
```

페이지네이션 vs 스크롤 비교 테스트:
```bash
python test_5_categories.py --mode compare
```

### 2. 메인 파이프라인 실행

전체 데이터 수집 (제품 상세, 랭킹, 리뷰):
```bash
python main.py --mode full
```

랭킹만 수집:
```bash
python main.py --mode scrape-only
```

### 3. 개별 카테고리 스크래핑 (Python 코드)

```python
import asyncio
from scrapers.rank_scraper import RankScraper

async def scrape_single_category():
    url = "https://www.amazon.com/Best-Sellers-Beauty-Personal-Care-Lip-Care-Products/zgbs/beauty/3761351/..."

    async with RankScraper() as scraper:
        # 스크롤 방식으로 100개 제품 수집
        products = await scraper.scrape(
            category_url=url,
            max_rank=100,
            use_scroll=True  # 스크롤 사용
        )

        print(f"Collected {len(products)} products")
        for product in products[:5]:
            print(f"#{product['rank']}: {product['product_name']}")

asyncio.run(scrape_single_category())
```

## 스크롤 vs 페이지네이션

### 스크롤 방식 (use_scroll=True)
- **장점**: 실제 사용자 행동과 유사, 동적 로딩 지원
- **단점**: 느릴 수 있음
- **사용 시나리오**: 50-100개 제품, 정확한 데이터 필요

### 페이지네이션 방식 (use_scroll=False)
- **장점**: 빠름, 예측 가능
- **단점**: 일부 페이지에서 작동하지 않을 수 있음
- **사용 시나리오**: 대량 데이터, 빠른 수집 필요

## 스크롤 방식 상세 동작

```python
async def _scrape_with_scroll(self, category_url, max_rank=100):
    1. 페이지 로드
    2. 초기 제품 추출
    3. 반복 (최대 10번 스크롤):
        a. 현재 보이는 모든 제품 추출
        b. 중복 제거 (ASIN 기준)
        c. 목표 수량 도달 확인
        d. 페이지 하단으로 스크롤
        e. 2-4초 대기 (제품 로딩)
        f. 새 제품 없으면 3회 후 종료
    4. max_rank 제한 적용
    5. 결과 반환
```

## 출력 파일

### 테스트 결과
```
output/test_5_categories_YYYYMMDD_HHMMSS.json
```

예시 구조:
```json
{
  "Beauty & Personal Care": {
    "category": "Beauty & Personal Care",
    "success": true,
    "products_count": 50,
    "products": [
      {
        "rank": 1,
        "asin": "B0XXXXXXXX",
        "product_name": "Product Name",
        "price": 19.99,
        "rating": 4.5,
        "review_count": 1234,
        "product_url": "...",
        "scraped_at": "2025-01-01T12:00:00"
      }
    ]
  },
  "Lip Care Products": { ... },
  ...
}
```

### 메인 파이프라인 결과
```
data/ranks_YYYYMMDD_HHMMSS.json
output/m1_breadcrumb_traffic.json
output/m1_volatility_index.json
```

## 설정 조정

### 스크롤 횟수 조정
`rank_scraper.py`에서:
```python
max_scrolls = 10  # 기본값: 10, 더 많은 제품이 필요하면 증가
```

### 스크롤 대기 시간 조정
```python
await self.random_delay(2, 4)  # 2-4초 랜덤 대기
```

### Rate Limiting
`config/settings.py`에서:
```python
RATE_LIMIT = {
    "requests_per_minute": 15,
    "requests_per_hour": 200,
    "cool_down_period": 300,
}
```

## 문제 해결

### 1. 제품이 50개 미만으로 수집되는 경우
- `max_scrolls` 값을 증가 (10 → 15)
- 스크롤 대기 시간 증가 (2-4초 → 3-5초)

### 2. Rate Limiting 에러
- `RATE_LIMIT` 설정에서 `requests_per_minute` 감소
- 카테고리 간 대기 시간 증가 (`asyncio.sleep(5)` → `asyncio.sleep(10)`)

### 3. 타임아웃 에러
- `SCRAPER_SETTINGS["timeout"]` 증가 (30 → 60)
- Headless 모드 해제 (`headless: False`)로 디버깅

### 4. Selector 오류
- Amazon이 HTML 구조를 변경한 경우
- `rank_scraper.py`의 CSS 선택자 업데이트 필요
- `.zg-grid-general-faceout` 등 확인

## 로그 확인

실시간 로그:
```bash
tail -f logs/collector_*.log
```

테스트 로그:
```bash
tail -f logs/test_5_categories_*.log
```

## 성능 최적화

### 병렬 처리 (주의: Rate Limiting)
```python
# 현재: 순차 처리
for category in categories:
    await scrape(category)

# 병렬 처리 (조심히 사용)
await asyncio.gather(*[scrape(cat) for cat in categories])
```

### 캐싱
```python
FEATURES = {
    "enable_caching": True,  # 중복 요청 방지
}
```

## 다음 단계

1. **스케줄링**: 매일 자동 수집
   ```bash
   # cron 예시 (Linux/Mac)
   0 2 * * * cd /path/to/data-collector && python main.py --mode full
   ```

2. **데이터베이스 저장**: SQLite → PostgreSQL
3. **대시보드 연동**: `output/` 파일을 React 앱에 복사
4. **알림**: 새로운 제품 발견 시 알림

## 지원

문제 발생 시:
1. 로그 파일 확인
2. `--mode compare`로 방식 비교
3. `DEV_MODE=true`로 스크린샷 활성화
