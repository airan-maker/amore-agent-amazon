# Ranking Trend 차트 수정 완료

## 문제점
- **증상**: Product Detail Modal의 Ranking Trend 차트에서 1/1 데이터 포인트가 없음
- **원인**: `generateHistoricalRankings.js`를 사용하여 **가짜 데이터**를 생성하고 있었음
- **해결**: 실제 수집된 **daily ranking JSON**을 사용하도록 변경

## 수정 내용

### 1. Import 변경
**Before** (가짜 데이터):
```javascript
import { getProductRankingHistory } from '../utils/generateHistoricalRankings';
```

**After** (실제 데이터):
```javascript
import {
  getProductRankingHistory,
  getAvailableDates,
  formatDate
} from '../utils/loadHistoricalData';
```

### 2. 실제 수집 데이터 사용
```javascript
// 실제 수집된 historical data에서 제품의 ranking history 로드
const history = getProductRankingHistory(historicalData, asin, category);
```

**데이터 소스**:
- `app/src/data/historical/test_5_categories_20260101.json`
- `app/src/data/historical/test_5_categories_20260102.json`
- ...
- `app/src/data/historical/test_5_categories_20260108.json`

### 3. 날짜 범위 동적 표시
**Before** (하드코딩):
```javascript
<h3>Ranking Trend (Jan 1, 2025 - Jan 1, 2026)</h3>
```

**After** (실제 데이터 기반):
```javascript
<h3>Ranking Trend {dateRange && `(${dateRange})`}</h3>
```

실제 데이터에서 날짜 범위를 계산:
```javascript
const dates = getAvailableDates(historicalData);
const startDate = dates[dates.length - 1]; // 가장 오래된 날짜
const endDate = dates[0]; // 가장 최근 날짜
setDateRange(`${formatDate(startDate)} - ${formatDate(endDate)}`);
```

### 4. 디버그 로그 추가
```javascript
console.log('Historical data available:', historicalData ? Object.keys(historicalData).length : 0, 'dates');
console.log('Loading ranking history for:', { asin, category });
console.log('Ranking history loaded:', history.length, 'data points');
```

## 확인 사항

### 사용 가능한 데이터
```bash
# 8일간의 데이터 확인
ls -lh app/src/data/historical/

-rw-r--r-- test_5_categories_20260101.json (255K)
-rw-r--r-- test_5_categories_20260102.json (250K)
-rw-r--r-- test_5_categories_20260103.json (250K)
-rw-r--r-- test_5_categories_20260104.json (250K)
-rw-r--r-- test_5_categories_20260105.json (250K)
-rw-r--r-- test_5_categories_20260106.json (250K)
-rw-r--r-- test_5_categories_20260107.json (250K)
-rw-r--r-- test_5_categories_20260108.json (253K)
```

### 데이터 구조
각 파일은 다음 구조를 가짐:
```json
{
  "Beauty & Personal Care": {
    "category": "Beauty & Personal Care",
    "products": [
      {
        "rank": 1,
        "asin": "B074PVTPBW",
        "product_name": "Product Name",
        "rating": 4.5,
        "review_count": 12345,
        "scraped_at": "2026-01-01T11:00:00"
      },
      ...
    ]
  }
}
```

## 동작 방식

### 1. 데이터 로딩
```javascript
// AIMarketAnalysis.jsx에서
const historical = await loadHistoricalRankings();
setHistoricalData(historical);
// => {
//   "2026-01-01": { categories... },
//   "2026-01-02": { categories... },
//   ...
//   "2026-01-08": { categories... }
// }
```

### 2. ProductDetailModal로 전달
```javascript
<ProductDetailModal
  product={selectedProduct}
  historicalData={historicalData}  // 8일간의 데이터
  category={selectedCategory}
/>
```

### 3. Ranking History 생성
```javascript
// ProductDetailModal.jsx에서
const history = getProductRankingHistory(historicalData, asin, category);
// => [
//   { date: "2026-01-01", rank: 15, rating: 4.5, review_count: 1234 },
//   { date: "2026-01-02", rank: 14, rating: 4.5, review_count: 1235 },
//   ...
//   { date: "2026-01-08", rank: 12, rating: 4.6, review_count: 1250 }
// ]
```

### 4. 차트 렌더링
- X축: 날짜 (1/1, 1/2, ..., 1/8)
- Y축: 랭킹 (역순, 1이 최상위)
- Line: 제품의 랭킹 변화 추이

## 예상 결과

### Before
```
Ranking Trend (Jan 1, 2025 - Jan 1, 2026)
[가짜 데이터로 생성된 차트]
- 실제 수집 데이터와 일치하지 않음
- 1/1 데이터 포인트 없음 (가짜 데이터 생성 로직 문제)
```

### After
```
Ranking Trend (2026년 1월 1일 - 2026년 1월 8일)
[실제 수집된 데이터 기반 차트]
- 8개 데이터 포인트 (1/1, 1/2, ..., 1/8)
- 실제 랭킹 변화 반영
- 제품이 특정 날짜에 Top 100 밖이면 해당 날짜 데이터 없음
```

## 특별 케이스

### 케이스 1: 제품이 1/1에 Top 100 밖이었던 경우
만약 특정 제품의 ASIN이 20260101 파일에는 없고, 20260102부터 있다면:
```javascript
// Ranking history
[
  { date: "2026-01-02", rank: 95, ... },  // 1/2부터 데이터 시작
  { date: "2026-01-03", rank: 90, ... },
  ...
  { date: "2026-01-08", rank: 75, ... }
]
```

이 경우 차트는 1/2부터 시작하며, 이는 **정상**입니다.
(해당 제품이 1/1에는 Top 100에 없었기 때문)

### 케이스 2: 신제품
만약 제품이 1/5부터 Top 100에 진입했다면:
```javascript
// Ranking history
[
  { date: "2026-01-05", rank: 98, ... },  // 1/5부터 데이터 시작
  { date: "2026-01-06", rank: 85, ... },
  { date: "2026-01-07", rank: 70, ... },
  { date: "2026-01-08", rank: 60, ... }
]
```

## 브라우저 콘솔 확인

제품 상세 모달을 열면 다음 로그가 표시됨:
```
ProductDetailModal rendering with product: {...}
Historical data available: 8 dates
Loading ranking history for: { asin: "B07MFMWFYL", category: "Beauty & Personal Care" }
Ranking history loaded: 8 data points
```

만약 "Ranking history loaded: 0 data points"라면:
- 해당 제품이 해당 카테고리의 Top 100에 없음
- ASIN이 잘못되었거나
- Category가 잘못 매칭됨

## 테스트 방법

1. **개발 서버 실행**
```bash
cd app
npm run dev
```

2. **Market Analysis 페이지 이동**
- 날짜 선택: 2026-01-08 (가장 최근)
- 카테고리 선택: Beauty & Personal Care

3. **제품 클릭**
- 아무 제품이나 클릭하여 상세 모달 열기

4. **Ranking Trend 확인**
- 제목: "Ranking Trend (2026년 1월 1일 - 2026년 1월 8일)" 표시 확인
- 차트: 8개 데이터 포인트 (또는 제품이 Top 100에 진입한 시점부터) 확인
- 콘솔: 로그에서 "Ranking history loaded: X data points" 확인

## 다음 단계

1. ✅ **수정 완료** - 실제 daily ranking JSON 사용
2. ⏳ **테스트** - 브라우저에서 제품 상세 모달 확인
3. ⏳ **데이터 수집 계속** - 매일 11시 자동 수집으로 데이터 누적
4. ⏳ **장기 트렌드 분석** - 1주일, 1개월 데이터 누적 후 의미있는 트렌드 분석

## 추가 개선 가능 사항

### 1. 데이터 포인트가 적을 때 메시지
```javascript
{rankingHistory.length === 0 && (
  <div className="text-white/50 text-sm">
    이 제품의 랭킹 이력이 없습니다.
    (해당 기간 동안 Top 100 밖에 있었을 수 있습니다)
  </div>
)}

{rankingHistory.length > 0 && rankingHistory.length < 3 && (
  <div className="text-yellow-400/70 text-sm mb-2">
    데이터 포인트가 {rankingHistory.length}개로 적습니다.
    더 정확한 트렌드는 시간이 지나면서 누적됩니다.
  </div>
)}
```

### 2. 데이터 범위 표시
```javascript
{rankingHistory.length > 0 && (
  <div className="text-white/50 text-xs">
    {rankingHistory.length}개 데이터 포인트
    ({formatDate(rankingHistory[0].date)} - {formatDate(rankingHistory[rankingHistory.length - 1].date)})
  </div>
)}
```

### 3. 에러 핸들링 개선
- 파일 로딩 실패 시 fallback
- ASIN 매칭 실패 시 명확한 메시지
- 카테고리 불일치 시 알림
