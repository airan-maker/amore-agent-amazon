# Product Details Collection & Display

## 개요

각 제품의 상세 페이지 정보를 수집하고, Claude AI로 분석하여 프론트엔드에서 보여주는 기능입니다.

## 수집 정보

### 1. 제품명
- 정확한 제품명
- 브랜드 정보

### 2. 가격 및 규격
- 현재 가격
- 용량/크기
- 할인 정보

### 3. 별점
- 평균 별점
- 전체 리뷰 수

### 4. 주요 특징
- **제형 (Formula)**: 젤, 크림, 하이브리드 등
- **주요 성분 (Key Ingredients)**: 시어버터, 코코아버터 등
- **향기 (Scent)**: 바닐라, 무향 등
- **피부 타입/혜택 (Benefits)**: 보습, 진정 등
- **특별 기능 (Special Features)**: 파라벤 프리, 크루얼티 프리 등

### 5. 사용자 리뷰 요약
- **긍정 리뷰**: 고객이 좋아하는 점 (3-5개)
- **부정 리뷰**: 불만사항 및 참고사항 (3-5개)
- **전체 평가**: 한 줄 요약

## 사용 방법

### 1단계: 제품 목록 수집
```bash
cd data-collector
python test_5_categories.py --mode all
```

### 2단계: 제품 상세 정보 수집
```bash
# 카테고리당 10개 제품 상세 수집 (테스트)
python collect_product_details.py --max-per-category 10

# 모든 제품 상세 수집 (100개 x 5카테고리 = 500개)
python collect_product_details.py --max-per-category 100

# 특정 입력 파일 사용
python collect_product_details.py --input output/test_5_categories_20260101_092216.json
```

**예상 소요 시간:**
- 10개/카테고리 (50개 총): ~15분
- 100개/카테고리 (500개 총): ~2.5시간

### 3단계: 데이터 복사
```bash
# 최신 상세 데이터를 프론트엔드로 복사
copy data-collector\output\product_details_*.json app\src\data\product_details.json
```

### 4단계: 프론트엔드 실행
```bash
cd app
npm run dev
```

## 데이터 구조

### product_details.json
```json
{
  "B07DY2QRF6": {
    "basic_info": {
      "asin": "B07DY2QRF6",
      "product_name": "LANEIGE Lip Glowy Balm...",
      "rating": 4.7,
      "review_count": 34178
    },
    "detailed_info": {
      "title": "LANEIGE Lip Glowy Balm...",
      "price": {
        "formatted": "$18.00",
        "price": 18.00,
        "currency": "USD"
      },
      "images": ["https://..."],
      "features": [...],
      "sample_reviews": [...]
    },
    "analysis": {
      "product_name": "LANEIGE Lip Glowy Balm",
      "price_and_specs": {
        "price": "$18.00",
        "size": "10g"
      },
      "rating": 4.7,
      "key_features": {
        "formula": "Sheer tinted lip balm with glowy finish",
        "ingredients": "Shea butter, murumuru butter, raspberry extract",
        "scent": "Subtle berry scent",
        "benefits": "Hydrates and softens lips, provides natural color",
        "special_features": "Dermatologist tested, non-sticky formula"
      },
      "review_summary": {
        "positive": [
          "Extremely moisturizing and long-lasting",
          "Beautiful natural tint and shine",
          "Not sticky or heavy on lips"
        ],
        "negative": [
          "Price is higher than drugstore alternatives",
          "Some users wish for more color options"
        ],
        "overall_sentiment": "Customers love the moisturizing formula and natural finish, highly recommend for daily use"
      }
    },
    "category": "Lip Care Products",
    "processed_at": "2026-01-01T12:00:00"
  }
}
```

## 프론트엔드 사용

### Market Analysis 페이지
1. 제품 테이블에서 **제품명 클릭**
2. 모달 팝업에 상세 정보 표시

### 모달 내용
```
┌─────────────────────────────────────────┐
│  LANEIGE Lip Glowy Balm          [X]    │
├─────────────────────────────────────────┤
│  ⭐ 4.7 / 5.0    💵 $18.00 (10g)        │
│  [🔗 Amazon에서 보기]                    │
│                                         │
│  [Image] [Image] [Image] [Image]        │
│                                         │
│  📦 주요 특징 및 장점                     │
│  ┌─────────────────────────────────┐   │
│  │ 제형: Sheer tinted balm         │   │
│  │ 성분: Shea butter, murumuru...  │   │
│  │ 향기: Subtle berry scent        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✨ 고객 리뷰 분석                       │
│  "Customers love the moisturizing..."   │
│                                         │
│  👍 장점              👎 단점            │
│  • Moisturizing      • Higher price    │
│  • Natural tint      • Limited colors  │
│  • Non-sticky                          │
└─────────────────────────────────────────┘
```

### 새로운 기능
- **Amazon 직접 링크**: 모달 상단에 "Amazon에서 보기" 버튼 추가
- **브랜드 추출 개선**: 4-tier 알고리즘으로 90%+ 정확도
- **전략적 분석 모듈**: 5개 분석 모듈로 시장 인사이트 제공

## 아키텍처

### 백엔드 (Data Collection)

```
1. ProductDetailScraper
   ├─ Amazon 제품 페이지 접근
   ├─ 제품 정보 추출
   └─ 샘플 리뷰 수집 (최대 20개)

2. ProductAnalyzer
   ├─ Claude AI API 호출
   ├─ 특징 카테고리화
   └─ 리뷰 요약 생성

3. collect_product_details.py
   ├─ 전체 프로세스 오케스트레이션
   ├─ Rate limiting (3초 간격)
   └─ JSON 저장
```

### 프론트엔드 (Display)

```
1. ProductCatalog.jsx
   ├─ 제품 테이블 표시
   ├─ 클릭 이벤트 처리
   └─ 모달 오픈

2. ProductDetailModal.jsx
   ├─ 상세 정보 렌더링
   ├─ ReactMarkdown 통합
   │   ├─ AI 분석 결과 마크다운 렌더링
   │   ├─ Tailwind prose 스타일링
   │   └─ 볼드, 리스트, 헤딩 자동 포맷팅
   ├─ Framer Motion 애니메이션
   └─ 닫기 처리
```

## Claude API 사용

### 특징 분석 프롬프트
```
Analyze this beauty/skincare product and extract key features:

Product Features:
- Feature 1
- Feature 2
...

Categorize into:
1. Formula/Texture
2. Key Ingredients
3. Scent/Fragrance
4. Skin Type/Benefits
5. Special Features
```

### 리뷰 요약 프롬프트
```
Analyze customer reviews and provide:

POSITIVE REVIEWS:
Rating 5/5: "Great product..."
...

NEGATIVE REVIEWS:
Rating 2/5: "Not for me..."
...

Provide:
1. Positive Summary (3-5 bullet points)
2. Negative Summary (3-5 bullet points)
3. Overall Sentiment (one sentence)
```

## 비용 추정

### Claude API 비용 (Haiku)
- 입력: ~$0.80 per million tokens
- 출력: ~$4.00 per million tokens

### 제품당 예상 토큰
- 입력: ~1,000 tokens
- 출력: ~500 tokens

### 총 비용 (500개 제품)
```
입력: 500 * 1,000 / 1,000,000 * $0.80 = $0.40
출력: 500 * 500 / 1,000,000 * $4.00 = $1.00
총합: ~$1.40
```

## 성능 최적화

### Rate Limiting
```python
# 제품간 3초 대기
await asyncio.sleep(3)

# Amazon: 15 req/min
# Claude: 제한 없음 (Haiku)
```

### 배치 처리
```bash
# 카테고리별로 나눠서 실행
python collect_product_details.py --max-per-category 10
# 확인 후
python collect_product_details.py --max-per-category 100
```

### 캐싱
- 이미 수집된 ASIN은 스킵 (향후 구현)
- Incremental save로 중간 저장

## 문제 해결

### 1. Claude API 키 오류
```bash
# .env 파일 확인
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. 상세 정보 미표시
```bash
# 데이터 파일 확인
ls app/src/data/product_details.json

# 없으면 복사
copy data-collector\output\product_details_*.json app\src\data\product_details.json
```

### 3. 모달 안 열림
- 브라우저 콘솔 확인
- ProductDetailModal import 확인

## 향후 개선

1. **실시간 로딩**
   - 클릭 시 API 호출
   - 로딩 스피너 표시

2. **더 많은 정보**
   - Q&A 섹션
   - 비슷한 제품 추천

3. **비교 기능**
   - 여러 제품 동시 비교
   - 사이드바이사이드 표시

4. **즐겨찾기**
   - 관심 제품 저장
   - 나중에 보기

## 예시 출력

### 수집 로그
```
================================================================================
PRODUCT DETAIL COLLECTION
================================================================================

================================================================================
Category: Lip Care Products
Total products: 100
Will collect details for: 10
================================================================================

[1/10] Processing: B07DY2QRF6
  Name: LANEIGE Lip Glowy Balm...
  Analyzing with Claude AI...
  ✓ Complete: B07DY2QRF6

[2/10] Processing: B01MF63BCU
  Name: eos Organic Lip Balm...
  Analyzing with Claude AI...
  ✓ Complete: B01MF63BCU

...

✓ Completed category: Lip Care Products
  Collected: 10/10

================================================================================
✅ COLLECTION COMPLETE
📊 Total products detailed: 50
💾 Saved to: output/product_details_20260101_120000.json
================================================================================
```

## 라이선스

AMORE PACIFIC AI Agent 07 프로젝트의 일부
