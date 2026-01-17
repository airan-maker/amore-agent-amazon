# LANEIGE Intelligence 페이지 재설계 제안

## 현재 상황 분석

### 데이터 현황
- **product_details.json**: 431개 제품의 상세 정보 (리뷰, 가격, 이미지, 특징)
- **분석 대상 6개 제품 중 데이터 수집 완료**: 3/6
  - ✅ LANEIGE Lip Sleeping Mask (B07XXPHQZK) - 54,192 reviews
  - ✅ COSRX Snail Essence (B00PBX3L7K)
  - ✅ Biodance Mask (B0B2RM68G2)
  - ❌ LANEIGE Water Sleeping Mask (B00Y16CXS6) - 수집 필요
  - ❌ LANEIGE Cream Skin Toner (B0CB93H6G7) - 수집 필요
  - ❌ Anua Heartleaf Toner (B08CMS8P67) - 수집 필요

### 현재 M1/M2 모듈의 문제점
1. **수동 생성 데모 데이터** 사용 중
2. **실제 Amazon 데이터와 불일치**
3. **스케일링 불가능** - 신규 제품 추가 시 수동 작업 필요

---

## 제안: AI 기반 자동 데이터 생성 시스템

### Phase 1: 실시간 데이터 활용 (즉시 구현 가능)

#### M2: Review Intelligence (우선 구현)
**product_details.json의 sample_reviews를 활용하여 자동 생성 가능:**

1. **Usage Context Analysis** (사용 맥락 분석)
   - AI가 리뷰 텍스트에서 사용 패턴 추출
   - "after retinol", "winter dryness", "makeup primer" 등의 키워드 자동 감지
   - 감성 분석 (sentiment_score)으로 만족도 측정

2. **Intelligence Bridge** (인텔리전스 브릿지)
   - 리뷰에서 "pain points" 자동 추출
   - 제품 특징(features)과 리뷰 매칭으로 효능 검증
   - 경쟁사 언급 분석

**구현 방법:**
```python
# Python 스크립트로 자동 생성
def generate_usage_context_from_reviews(product_asin):
    reviews = product_details[product_asin]['detailed_info']['sample_reviews']

    # AI/NLP로 리뷰 분석
    contexts = analyze_review_patterns(reviews)
    # - 시간대 (night/morning)
    # - 계절 (winter/summer)
    # - 피부 고민 (acne/dryness)
    # - 함께 사용하는 제품

    return {
        "usage_contexts": contexts,
        "demographic_insights": extract_demographics(reviews),
        "strategic_targeting": generate_recommendations(contexts)
    }
```

#### M1: Market Landscape (부분 구현 가능)

**현재 데이터로 생성 가능:**
1. **Emerging Brands** (신흥 브랜드)
   - 431개 제품의 rating, review_count로 성장세 분석
   - 리뷰 증가율, 평점 추이 계산

**추가 데이터 수집 필요:**
1. **Breadcrumb Traffic** (카테고리 트래픽)
   - Amazon 카테고리 정보 수집 필요
   - 또는 제품 URL에서 breadcrumb 추출

2. **Volatility Index** (변동성 지수)
   - 시계열 데이터 필요 (순위 변화 추적)
   - 주기적 스크래핑 필요

---

## 구현 계획

### Option A: Full AI 자동 생성 (권장)

**장점:**
- 실제 데이터 기반 분석
- 신규 제품 자동 추가 가능
- 데이터 업데이트 시 자동 반영

**구현 단계:**
1. **Week 1**: M2 Review Intelligence 자동 생성
   - Python/Node.js 스크립트 개발
   - OpenAI API 또는 로컬 NLP 모델 사용
   - sample_reviews → usage_context.json 변환

2. **Week 2**: M1 Emerging Brands 자동 생성
   - 431개 제품 분석
   - 성장률, 시장 점유율 계산

3. **Week 3**: M1 Breadcrumb & Volatility (선택사항)
   - 추가 스크래핑 또는 API 연동

**예상 비용:**
- OpenAI API 사용 시: ~$50-100 (1회 생성)
- 로컬 모델 사용 시: 무료 (처리 시간 더 소요)

### Option B: 하이브리드 접근

**장점:**
- 빠른 구현
- 비용 절감

**방법:**
1. **M2는 AI 자동 생성** (리뷰 데이터 충분)
2. **M1은 현재 수동 데이터 유지** (추가 스크래핑 없이)
3. 점진적으로 M1도 자동화

### Option C: 현재 구조 유지 + 데이터만 업데이트

**장점:**
- 가장 간단
- 즉시 적용 가능

**방법:**
1. 3개 누락 제품(LANEIGE 2개, Anua 1개) 스크래핑
2. 수동으로 product_details.json 리뷰 읽고 M1/M2 데이터 업데이트
3. 구조는 그대로 유지

---

## 기술 스택 제안

### AI 기반 리뷰 분석
```javascript
// Node.js + OpenAI API
const analyzeReviews = async (reviews) => {
  const prompt = `
    Analyze these Amazon reviews and extract:
    1. Usage contexts (when/how customers use this product)
    2. Key phrases (exact quotes from reviews)
    3. Skin concerns mentioned
    4. Companion products
    5. Sentiment score

    Reviews: ${JSON.stringify(reviews)}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  return JSON.parse(response.choices[0].message.content);
};
```

### 또는 Python + Transformers (로컬)
```python
from transformers import pipeline

sentiment_analyzer = pipeline("sentiment-analysis")
ner = pipeline("ner")

def extract_usage_context(review_text):
    # 감성 분석
    sentiment = sentiment_analyzer(review_text)

    # 개체명 인식 (제품명, 피부 타입 등)
    entities = ner(review_text)

    # 패턴 매칭
    time_patterns = ["morning", "night", "before bed"]
    season_patterns = ["winter", "summer", "spring", "fall"]

    return {
        "sentiment_score": sentiment[0]['score'],
        "time_of_use": find_pattern(review_text, time_patterns),
        "season": find_pattern(review_text, season_patterns),
        "skin_concerns": extract_concerns(entities)
    }
```

---

## 즉시 실행 가능한 액션

### 1단계: 누락 제품 데이터 수집 (1-2시간)
```bash
# 3개 제품 스크래핑
python scraper.py --asins B00Y16CXS6,B0CB93H6G7,B08CMS8P67
```

### 2단계: AI 자동 생성 스크립트 개발 (1-2일)
```bash
# M2 자동 생성
node scripts/generate_m2_from_reviews.js

# 결과: m2_usage_context_generated.json
# 결과: m2_intelligence_bridge_generated.json
```

### 3단계: 프론트엔드 연동 (1-2시간)
```javascript
// 기존 JSON import를 생성된 파일로 교체
import usageContextData from '../data/m2_usage_context_generated.json';
import intelligenceBridgeData from '../data/m2_intelligence_bridge_generated.json';
```

---

## 예상 결과

### Before (현재)
- ❌ 수동으로 작성한 데모 데이터
- ❌ 실제 리뷰와 불일치
- ❌ 업데이트 불가능

### After (AI 자동 생성)
- ✅ 실제 Amazon 리뷰 기반
- ✅ 54,000+ 리뷰 분석 결과
- ✅ 신규 제품 자동 추가
- ✅ 주기적 업데이트 가능
- ✅ 데이터 신뢰도 향상

---

## 추천 사항

**즉시 실행:**
1. ✅ ASIN 업데이트 완료 (B07XXPHQZK)
2. 🔄 3개 누락 제품 스크래핑
3. 🚀 M2 Review Intelligence AI 자동 생성 (가장 효과적)

**향후 검토:**
- M1 Breadcrumb 추가 스크래핑
- Volatility Index 시계열 데이터 수집
- 주기적 업데이트 자동화 (GitHub Actions 등)

---

## 결론

**네, LANEIGE Intelligence를 product_details.json 기반으로 재작성 가능합니다!**

가장 큰 가치는 **M2 Review Intelligence** 모듈입니다:
- 54,192개 리뷰 (Lip Sleeping Mask alone)
- AI로 자동 분석 가능
- 실제 고객 목소리 반영

**다음 단계를 결정해 주세요:**
1. 전체 AI 자동 생성 시스템 개발?
2. M2만 AI 생성, M1은 유지?
3. 누락 3개 제품 먼저 수집?
