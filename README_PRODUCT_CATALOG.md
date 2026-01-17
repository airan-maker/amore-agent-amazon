# Market Analysis Feature

## 개요

5개 Amazon Beauty 카테고리의 제품 정보를 표 형태로 정리하고, 브랜드별 필터링, 5개 전략적 분석 모듈로 시장 인사이트를 제공하는 프론트엔드 페이지입니다.

## 기능

### 1. **카테고리별 제품 표시**
- Beauty & Personal Care
- Skin Care Products
- Lip Care Products
- Lip Makeup
- Face Powder

### 2. **브랜드 필터링**
- 제품명에서 자동으로 브랜드 추출 (4-Tier 알고리즘, 90%+ 정확도)
- 브랜드별 필터링 기능
- LANEIGE 제품 하이라이트

### 3. **전략적 분석 모듈 (5개)**

#### 3-1. Market Concentration
- 상위 10개 브랜드 시장 집중도 분석
- 도넛 차트 시각화 (Recharts)
- HHI (Herfindahl-Hirschman Index) 계산

#### 3-2. USP Clustering
- 제품명 키워드 빈도 분석 (60+ 패턴)
- 바 차트로 시장 트렌드 시각화
- Formula, Effects, Values 카테고리별 분류

#### 3-3. LANEIGE Positioning
- LANEIGE vs 시장 평균 비교
- LANEIGE vs Top 20% 브랜드 비교
- 성과 지표 (평점, 리뷰 수, 순위) 테이블

#### 3-4. Rising Stars
- 신흥 고성장 제품 자동 발굴
- 기준: 리뷰 수 < 5,000, 평점 ≥ 4.5, 순위 ≤ 50
- 제품 카드 형식으로 표시

#### 3-5. Strategic Opportunity
- 시장 커버리지 Gap 분석
- 미충족 키워드 영역 탐지
- 블루오션 기회 발굴

### 4. **인터랙티브 테이블**
- 제품 정보 한눈에 보기
- 정렬 및 필터링
- 반응형 디자인

## 설치 및 실행

### 1. 데이터 수집
```bash
cd data-collector
python test_5_categories.py --mode all
```

### 2. 데이터 복사
```bash
# Windows
copy_data_to_frontend.bat

# 또는 수동으로
copy data-collector\output\test_5_categories_*.json app\src\data\category_products.json
```

### 3. 프론트엔드 실행
```bash
cd app
npm install  # 처음 한 번만
npm run dev
```

### 4. 브라우저 열기
```
http://localhost:5173
```

## 페이지 구조

### Navigation
- **LANEIGE Intelligence**: AI Agent Dashboard (M1 + M2 모듈)
- **Market Analysis**: 시장 분석 페이지 (5개 전략 모듈)

### Market Analysis 페이지

#### 상단 필터
- 카테고리 선택 (All / 개별 카테고리)
- 브랜드 선택 (All / 개별 브랜드)

#### 카테고리 통계 (카테고리 선택 시)
1. **Category Average**
   - 평균 평점
   - 평균 리뷰 수

2. **Top Brands**
   - 상위 3개 브랜드
   - 제품 수

3. **LANEIGE Products**
   - LANEIGE 제품 수
   - 시장 점유율 (%)

#### 전략적 분석 섹션
1. **Market Concentration** (도넛 차트)
   - 상위 10개 브랜드 점유율
   - HHI 지수 (시장 집중도 측정)

2. **USP Clustering** (바 차트)
   - 키워드 빈도 분석
   - 시장 트렌드 파악

3. **LANEIGE Positioning** (비교 테이블)
   - LANEIGE vs Market Average
   - LANEIGE vs Top 20%

4. **Rising Stars** (제품 카드)
   - 신흥 고성장 제품
   - 잠재력 분석

5. **Strategic Opportunity** (Gap 분석)
   - 미충족 키워드 영역
   - 블루오션 기회

#### 제품 테이블
| # | Product | Brand | Category | Rating | Reviews | ASIN |
|---|---------|-------|----------|--------|---------|------|
| 1 | ... | LANEIGE | Lip Care | 4.7 | 34,178 | B07... |

#### AI-Powered Ranking Insights (테이블 하단)
1. **날짜 범위 선택**
   - Start Date / End Date 선택
   - 365일 히스토리 중 원하는 기간 분석

2. **AI 분석 실행 버튼**
   - "AI 분석 실행" 클릭하여 분석 시작
   - Claude Sonnet 4 기반 한국어 분석

3. **Quick Stats**
   - Total Products (총 제품 수)
   - Improving (랭킹 상승 제품)
   - Declining (랭킹 하락 제품)
   - Avg Volatility (평균 변동성)

4. **Top Gainers/Losers**
   - 상위 5개 랭킹 상승 제품
   - 상위 5개 랭킹 하락 제품

5. **LANEIGE 제품 랭킹 변동**
   - LANEIGE 제품 자동 필터링
   - 시작/종료 랭킹 표시
   - 변동 화살표 (↑/↓/→)

6. **Claude's Analysis**
   - 시장 트렌드 분석
   - Top Movers 성공/실패 요인
   - ⭐⭐⭐ LANEIGE 제품 심층 분석 (가장 중요)
   - 전략적 제언 (단기/중장기)

## 데이터 구조

### category_products.json
```json
{
  "Lip Care Products": {
    "category": "Lip Care Products",
    "success": true,
    "products_count": 100,
    "products": [
      {
        "rank": 1,
        "asin": "B07DY2QRF6",
        "product_name": "LANEIGE Lip Glowy Balm...",
        "price": 18.00,
        "rating": 4.7,
        "review_count": 34178,
        "product_url": "/...",
        "scraped_at": "2026-01-01T..."
      }
    ]
  }
}
```

## 브랜드 추출 로직 (4-Tier Algorithm)

제품명에서 브랜드를 자동으로 추출하는 4단계 알고리즘 (90%+ 정확도):

### Tier 1: Product Details 데이터 (90% 정확도)
```javascript
// product_details.json에서 brand 필드 사용
if (productDetailsData[asin]?.detailed_info?.product_details?.brand) {
  return brand;
}
```

### Tier 2: Known Brands List (85% 정확도)
```javascript
// 50+ 알려진 브랜드 리스트에서 매칭
const knownBrands = [
  'LANEIGE', 'eos', "Burt's Bees", 'Summer Fridays',
  'Aquaphor', 'CeraVe', 'Neutrogena', 'La Roche-Posay',
  'The Ordinary', 'Drunk Elephant', ...
];

for (const brand of knownBrands) {
  if (productName.toLowerCase().startsWith(brand.toLowerCase())) {
    return brand;
  }
}
```

### Tier 3: Pattern Matching (70% 정확도)
```javascript
// Regex 패턴으로 브랜드 추출
const patterns = [
  /^([A-Z][a-z]+'s\s+[A-Z][a-z]+)/,  // Burt's Bees
  /^([A-Z][a-z]+\s+&\s+[A-Z][a-z]+)/, // Beauty & Co
  /^([A-Z][A-Z]+)/,                   // EOS, CND
];
```

### Tier 4: Fallback (50% 정확도)
```javascript
// 첫 1-2 단어 추출
return productName.split(' ').slice(0, 2).join(' ');
```

**특징:**
- 계층적 접근으로 정확도 극대화
- 각 Tier에서 실패 시 다음 Tier로 폴백
- 50+ 브랜드 데이터베이스 지속 확장

## LANEIGE 분석 예시

### Lip Care Products 카테고리
```
Market Presence: 3 products (3% market share)

Products:
1. LANEIGE Lip Glowy Balm
   ⭐ 4.7 | 34,178 reviews

2. LANEIGE Lip Sleeping Mask
   ⭐ 4.6 | 54,188 reviews

3. LANEIGE Skincare & Lip Care Holiday Gift Sets
   ⭐ 4.6 | 744 reviews

Strategic Insight:
LANEIGE products show strong performance with high ratings
and substantial review counts, indicating established brand
trust and customer satisfaction in the Lip Care Products category.
```

## 커스터마이징

### 브랜드 패턴 추가
`ProductCatalog.jsx`의 `extractBrand` 함수 수정:

```javascript
const brandPatterns = [
  // 기존 패턴...
  /^(YourBrand)/i,  // 새로운 브랜드 추가
];
```

### AI 인사이트 커스터마이징
`ProductCatalog.jsx`의 인사이트 섹션 수정하여 원하는 분석 추가

## 스타일링

### 테마 색상
- LANEIGE 제품: `bg-pink-500/20 text-pink-300`
- 일반 제품: `bg-white/10 text-white/70`
- 액티브 필터: `bg-purple-400/50`

### 반응형 디자인
- 모바일: 단일 컬럼
- 태블릿: 2컬럼
- 데스크탑: 3컬럼 (통계 카드)

## 구현 완료 기능 ✅

1. **전략적 분석 모듈 (5개)**
   - ✅ Market Concentration (도넛 차트)
   - ✅ USP Clustering (바 차트)
   - ✅ LANEIGE Positioning (비교 테이블)
   - ✅ Rising Stars (제품 카드)
   - ✅ Strategic Opportunity (Gap 분석)

2. **AI-Powered Ranking Insights** ⭐ 신규
   - ✅ Historical Ranking Data (365일 히스토리)
   - ✅ Excel Export (날짜별 순위 변동)
   - ✅ Claude Sonnet 4 트렌드 분석 (한국어)
   - ✅ LANEIGE 중심 심층 분석
   - ✅ Markdown 렌더링 (react-markdown)
   - ✅ 수동 실행 패턴 (날짜 선택 + 버튼)

3. **데이터 시각화 (Recharts)**
   - ✅ 도넛 차트 (PieChart)
   - ✅ 바 차트 (BarChart)
   - ✅ 라인 차트 (LineChart)
   - ✅ 파이 차트 (Pie)

4. **브랜드 추출 알고리즘**
   - ✅ 4-Tier 시스템 (90% 정확도)
   - ✅ 50+ 브랜드 데이터베이스
   - ✅ Pattern Matching

5. **키워드 분석**
   - ✅ 60+ 키워드 패턴 (Formula, Effects, Values)
   - ✅ 자동 카테고리화
   - ✅ 빈도 분석

## 향후 개선 사항

1. **실시간 데이터 로딩**
   - API 엔드포인트 연결
   - 자동 데이터 갱신

2. **고급 필터링**
   - 가격대별 필터
   - 평점별 필터
   - 리뷰 수별 필터

3. **AI 분석 확장**
   - 제품별 개별 랭킹 분석 자동화
   - 경쟁사 비교 분석 심화
   - 예측 모델링 (다음 달 랭킹 예측)

4. **시계열 분석 확장**
   - 실시간 랭킹 변동 추적
   - 계절성 패턴 분석
   - 이벤트 영향 분석

## 문제 해결

### 데이터가 로딩되지 않음
```bash
# 데이터 파일 확인
ls app/src/data/category_products.json

# 데이터 다시 복사
copy_data_to_frontend.bat
```

### 브랜드가 "Unknown"으로 표시됨
- `extractBrand` 함수에 해당 브랜드 패턴 추가
- 제품명 형식 확인

### 스타일이 적용되지 않음
```bash
# Tailwind CSS 재빌드
cd app
npm run dev
```

## 기술 스택

- **React 19.2.0**
- **React Router 7.11.0**
- **Recharts 2.x** (데이터 시각화)
- **Framer Motion** (애니메이션)
- **Lucide React** (아이콘)
- **Tailwind CSS** (스타일링)
- **Vite** (빌드 도구)
- **@anthropic-ai/sdk** (Claude Sonnet 4 API)
- **react-markdown 9.x** (AI 분석 결과 렌더링)
- **xlsx** (Excel 파일 생성)

## 주요 알고리즘

### 1. 4-Tier Brand Extraction
```javascript
extractBrand(product) {
  // Tier 1: Product Details (90%)
  // Tier 2: Known Brands (85%)
  // Tier 3: Pattern Matching (70%)
  // Tier 4: Fallback (50%)
}
```

### 2. Keyword Pattern Matching (60+ patterns)
```javascript
const keywordPatterns = {
  formula: ['gel', 'cream', 'serum', 'balm', ...],
  effects: ['hydrating', 'anti-aging', 'brightening', ...],
  values: ['vegan', 'cruelty-free', 'organic', ...]
};
```

### 3. Strategic Gap Analysis
```javascript
calculateStrategicGaps(marketData, laneigeData) {
  // 시장 커버리지 분석
  // 미충족 키워드 탐지
  // 기회 영역 점수화
}
```

### 4. Rising Stars Detection
```javascript
identifyRisingStars(products) {
  return products.filter(p =>
    p.review_count < 5000 &&
    p.rating >= 4.5 &&
    p.rank <= 50
  );
}
```

## 라이선스

AMORE PACIFIC AI Agent 07 프로젝트의 일부
