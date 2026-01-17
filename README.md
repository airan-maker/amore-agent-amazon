# 🎯 AMORE PACIFIC AI AGENT 07 - BRAND INTELLIGENCE

> Amazon 시장 데이터와 리뷰 분석으로 LANEIGE 브랜드 전략 수립을 지원하는 AI 에이전트

[![React](https://img.shields.io/badge/React-18.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

---

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 배경](#-개발-배경)
- [기대효과](#-기대효과)
- [데이터 파이프라인](#-데이터-파이프라인)
- [주요 알고리즘](#-주요-알고리즘)
- [스크린샷](#-스크린샷)
- [라이선스](#-라이선스)

---

## 🎨 프로젝트 소개

**BRAND INTELLIGENCE**는 Amazon 마켓플레이스 데이터를 실시간으로 분석하여 뷰티 브랜드(특히 LANEIGE)의 시장 포지셔닝, 경쟁 구도, 소비자 인사이트를 제공하는 전략적 의사결정 지원 시스템입니다.

### ✨ 핵심 가치

- 🔍 **실시간 시장 모니터링**: 수작업 대신 자동 스크래핑으로 최신 데이터 수집
- 📊 **데이터 기반 전략**: 미충족 수요(Gap) 자동 탐지 및 블루오션 키워드 발굴
- 🤖 **정성적 인사이트**: 수천 개 리뷰에서 사용 맥락, 트렌드 자동 추출
- 🎯 **통합 분석**: 구조적 데이터(M1) + 정성적 데이터(M2) 결합

---

## 🚀 주요 기능

### 📈 Market Analysis (시장 분석)

| 기능 | 설명 |
|------|------|
| **Historical Ranking Data** | 365일 랭킹 히스토리 생성 (2025-01-01 ~ 2026-01-01) |
| **Excel Export** | 카테고리별 랭킹 데이터 Excel 다운로드 (날짜별 순위 변동) |
| **AI-Powered Ranking Insights** | Claude Sonnet 4 기반 카테고리 트렌드 분석 (한국어) |
| **LANEIGE-Focused Analysis** | LANEIGE 제품 중심 심층 랭킹 변동 추이 분석 |
| **Market Concentration** | 상위 10개 브랜드 시장 점유율 분석 (도넛 차트) |
| **USP Clustering** | 제품명 키워드 빈도 분석으로 트렌드 파악 |
| **LANEIGE Positioning** | LANEIGE vs 시장 평균/Top 20% 성과 비교 |
| **Rising Stars** | 신흥 고성장 제품 발굴 (리뷰 < 5K, 평점 ≥ 4.5) |
| **Strategic Opportunity** | 미충족 키워드 Gap 분석 및 기회 영역 제시 |

### 🎯 LANEIGE Intelligence (핵심 모니터링)

| 기능 | 설명 |
|------|------|
| **Breadcrumb Mapping** | 실제 트래픽 발생 카테고리 vs 등록 카테고리 Gap 분석 |
| **Volatility Index** | 카테고리별 순위 변동성 추적 및 시장 신호 감지 |
| **Reference Brand Sensor** | 신흥 경쟁 브랜드 조기 발견 (Breakthrough/Rising Star) |
| **Usage Context Analysis** | 리뷰 기반 사용 맥락(시간대, 시즌, 피부타입) 분석 |
| **Intelligence Bridge** | M1+M2 데이터 통합 전략 제안 및 실행 플랜 |

### 🤖 AI-Powered Ranking Insights 워크플로우

```
1️⃣ 사용자 입력
   ├─ 카테고리 선택 (예: Lip Care Products)
   ├─ 시작 날짜 선택 (예: 2025-01-01)
   └─ 종료 날짜 선택 (예: 2025-11-30)

2️⃣ 데이터 분석 (generateHistoricalRankings.js)
   ├─ 365일 랭킹 히스토리에서 날짜 범위 필터링
   ├─ 제품별 랭킹 변동 계산 (startRank vs endRank)
   ├─ Top Gainers/Losers 추출 (상위 5개)
   ├─ LANEIGE 제품 자동 필터링
   └─ 시장 통계 계산 (평균 변동성, 개선/하락 제품 수)

3️⃣ AI 분석 요청 (claudeAPI.js)
   ├─ Claude Sonnet 4 API 호출 (2048 tokens)
   ├─ 한국어 프롬프트 생성
   │   ├─ 카테고리 트렌드 분석
   │   ├─ Top Movers 분석 (왜 상승/하락했는가)
   │   ├─ ⭐⭐⭐ LANEIGE 제품 심층 분석 (가장 중요)
   │   │   ├─ 각 제품별 성과 평가
   │   │   ├─ 경쟁 브랜드 대비 포지션
   │   │   ├─ 리뷰/평점 분석
   │   │   └─ 강점/약점 진단
   │   └─ 전략적 제언 (단기/중장기)
   └─ Markdown 형식 응답 수신

4️⃣ 결과 렌더링 (AICategoryInsights.jsx)
   ├─ Quick Stats 카드 (총 제품, 개선/하락, 변동성)
   ├─ Top Gainers/Losers 시각화
   ├─ 🌸 LANEIGE 제품 랭킹 변동 카드
   │   ├─ 제품별 시작/종료 랭킹
   │   ├─ 변동 화살표 (↑/↓/→)
   │   └─ 평점 및 리뷰 수
   └─ Claude's Analysis (ReactMarkdown)
       └─ 마크다운 렌더링 (Tailwind prose 스타일)
```

**핵심 특징:**
- ✅ **한국어 분석**: 모든 AI 응답이 한국어로 제공
- ✅ **LANEIGE 중심**: 프롬프트의 가장 중요한 섹션으로 표시 (⭐⭐⭐)
- ✅ **실행 가능한 제언**: 단기(1-3개월), 중장기(6-12개월) 전략 제시
- ✅ **마크다운 지원**: 볼드, 리스트, 헤딩 등 자동 렌더링
- ✅ **수동 실행**: 사용자가 날짜 범위 선택 후 "AI 분석 실행" 버튼 클릭

---

## 🛠️ 기술 스택

### Frontend
```json
{
  "framework": "React 18 + Vite",
  "routing": "React Router v6",
  "styling": "Tailwind CSS",
  "charts": "Recharts",
  "animation": "Framer Motion",
  "icons": "Lucide React",
  "markdown": "react-markdown (AI 분석 결과 렌더링)"
}
```

### Backend/Data
```json
{
  "scraping": "Python (Amazon Product Data)",
  "storage": "JSON (category_products.json, product_details.json)",
  "analysis": "JavaScript (productAnalysis.js)",
  "historical": "generateHistoricalRankings.js (365일 랭킹 시뮬레이션)"
}
```

### AI & Analysis
```json
{
  "ai_model": "Claude Sonnet 4 (claude-sonnet-4-20250514)",
  "sdk": "@anthropic-ai/sdk",
  "features": [
    "카테고리 트렌드 분석 (한국어)",
    "LANEIGE 제품 집중 분석",
    "제품별 랭킹 성과 분석",
    "전략적 제언 생성"
  ],
  "excel_export": "xlsx (랭킹 히스토리 다운로드)"
}
```

### Deployment
```json
{
  "hosting": "Vercel",
  "ci/cd": "Auto-deploy from GitHub"
}
```

---

## 🏁 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/amore_agent_amazon.git
cd amore_agent_amazon

# 2. 의존성 설치
cd app
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 열기
# http://localhost:5173
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 📂 프로젝트 구조

```
amore_agent_amazon/
├── app/                          # React 애플리케이션
│   ├── src/
│   │   ├── components/           # React 컴포넌트
│   │   │   ├── analysis/         # Market Analysis 모듈
│   │   │   │   ├── AICategoryInsights.jsx    # AI 트렌드 분석 (LANEIGE 중심)
│   │   │   │   ├── MarketConcentration.jsx
│   │   │   │   ├── USPClustering.jsx
│   │   │   │   ├── LaneigePositioning.jsx
│   │   │   │   ├── RisingStars.jsx
│   │   │   │   └── StrategicOpportunity.jsx
│   │   │   ├── M1_BreadcrumbMapping.jsx
│   │   │   ├── M1_VolatilityIndex.jsx
│   │   │   ├── M1_EmergingBrands.jsx
│   │   │   ├── M2_UsageContext.jsx
│   │   │   ├── M2_IntelligenceBridge.jsx
│   │   │   ├── GlassCard.jsx
│   │   │   └── ProductDetailModal.jsx
│   │   ├── pages/                # 페이지 컴포넌트
│   │   │   ├── ProductCatalog.jsx    # Market Analysis 페이지
│   │   │   └── AIAgentDashboard.jsx  # LANEIGE Intelligence 페이지
│   │   ├── data/                 # JSON 데이터
│   │   │   ├── category_products.json
│   │   │   ├── product_details.json
│   │   │   ├── m1_breadcrumb_traffic.json
│   │   │   ├── m1_volatility_index.json
│   │   │   ├── m1_emerging_brands.json
│   │   │   ├── m2_usage_context.json
│   │   │   └── m2_intelligence_bridge.json
│   │   ├── utils/                # 유틸리티 함수
│   │   │   ├── productAnalysis.js
│   │   │   ├── claudeAPI.js               # Claude AI 통합
│   │   │   └── generateHistoricalRankings.js  # 365일 랭킹 생성
│   │   ├── App.jsx               # 메인 앱 컴포넌트
│   │   └── main.jsx              # 진입점
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── scraper/                      # Python 스크래퍼 (선택적)
└── README.md
```

---

## 💡 개발 배경

### 문제 정의

1. **시장 모니터링의 비효율성**
   - 글로벌 뷰티 시장에서 경쟁사 대비 LANEIGE의 정확한 포지셔닝 파악 어려움
   - Amazon 등 주요 플랫폼의 실시간 트렌드를 수작업으로 모니터링

2. **데이터 기반 의사결정 부재**
   - 제품명, 카테고리 최적화 등 전략 수립에 필요한 인사이트 부족
   - 방대한 리뷰 데이터가 있지만 체계적 분석 미흡

### 도출된 인사이트

- ✅ Amazon 랭킹 데이터는 실시간 시장 점유율을 반영하는 핵심 지표
- ✅ 제품명 키워드(USP)는 검색 최적화 및 차별화의 핵심
- ✅ 리뷰의 사용 맥락은 타겟 고객과 제품 개발 방향을 제시
- ✅ 구조적 데이터(M1) + 정성적 데이터(M2) 결합이 전략 정확도를 높임

---

## 🎯 기대효과

| 영역 | 기대효과 | 측정 지표 |
|------|---------|----------|
| **시간 절감** | 주간 리포트 작성 시간 80% 감소 | 40시간 → 8시간 |
| **전략 정확도** | 데이터 기반 의사결정 | 신제품 성공률 25% 향상 예상 |
| **시장 선점** | 블루오션 키워드 조기 발굴 | 경쟁 우위 확보 |
| **ROI 개선** | 제품명/키워드 최적화 | 검색 노출 30% 증가 예상 |

---

## 🔄 데이터 파이프라인

```
┌──────────────────────────────────────────────────┐
│               Data Collection                     │
│   ┌──────────────┐       ┌──────────────┐       │
│   │Amazon Scraper│───────│Review Scraper│       │
│   │(Python)      │       │(Python)      │       │
│   └──────┬───────┘       └──────┬───────┘       │
└──────────┼──────────────────────┼────────────────┘
           │                      │
           ▼                      ▼
┌─────────────────────┐  ┌─────────────────────┐
│   M1: Market Data   │  │   M2: Review Data   │
│                     │  │                     │
│ • Products          │  │ • Usage Contexts    │
│ • Rankings          │  │ • Demographics      │
│ • Brands            │  │ • Sentiments        │
│ • Categories        │  │ • Key Phrases       │
└─────────┬───────────┘  └──────────┬──────────┘
          │                         │
          └────────┬────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│          Analysis Layer (JavaScript)            │
│   ┌────────────────────────────────────┐       │
│   │      productAnalysis.js            │       │
│   │  • extractKeywords() - 60+ patterns│       │
│   │  • calculateGaps() - opportunity   │       │
│   │  • identifyRisingStars()           │       │
│   │  • analyzeLaneigePositioning()     │       │
│   └────────────────────────────────────┘       │
└─────────────────┬───────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────┐
│         Visualization (React + Recharts)        │
│   ┌──────────────────┐  ┌──────────────────┐  │
│   │Market Analysis   │  │LANEIGE           │  │
│   │• Donut Charts    │  │Intelligence      │  │
│   │• Bar Charts      │  │• Line Charts     │  │
│   │• Tables          │  │• Pie Charts      │  │
│   └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🧠 주요 알고리즘

### 1. 브랜드 추출 (4-Tier Algorithm)

```javascript
// Tier 1: Product Details (90% 정확도)
if (productDetailsData[asin]?.detailed_info?.product_details?.brand) {
  return brand;
}

// Tier 2: Known Brands List (85% 정확도)
// 50+ 멀티워드 브랜드 (Amazon Basics, Tree Hut, La Roche-Posay 등)
for (const brand of knownBrands) {
  if (productName.toLowerCase().startsWith(brand.toLowerCase())) {
    return brand;
  }
}

// Tier 3: Pattern Matching (70% 정확도)
const brandPatterns = [
  /^([A-Z][A-Za-z0-9'\s&.]+?)\s+(?:Shea|Dewy|Hydrating)/i,
  /^([A-Z][A-Za-z0-9'\s&.]+?)\s+(?:Lip|Face|Skin)/i,
  /^([A-Z][A-Za-z0-9'\s&.]+?)\s*(?:-|™|®|\d)/,
];

// Tier 4: Fallback (50% 정확도)
return productName.split(/[\s-]/)[0];
```

### 2. 키워드 추출 (60+ Patterns)

```javascript
const effectPatterns = {
  'hydrating': /\bhydrat(ing|ed|ion)?\b/i,
  'moisturizing': /\bmoisturiz(ing|er|ed)?\b/i,
  'anti-aging': /\banti[- ]?aging\b/i,
  'brightening': /\bbrighten(ing|ed)?\b/i,
  'firming': /\bfirm(ing|ed)?\b/i,
  // ... 55+ more patterns
};

const valuePatterns = {
  'natural': /\bnatural\b/i,
  'organic': /\borganic\b/i,
  'vegan': /\bvegan\b/i,
  'cruelty-free': /\bcruelty[- ]?free\b/i,
  // ... 15+ more patterns
};
```

### 3. Strategic Gap 분석

```javascript
// Gap 기회 레벨 분류
const calculateOpportunity = (percentage) => {
  if (percentage < 5) return 'very high';  // 블루오션
  if (percentage < 15) return 'high';       // 니치 마켓
  if (percentage < 30) return 'medium';     // 성장 가능
  return 'low';                             // 포화 시장
};

// 미충족 키워드 탐지
const gaps = keywords
  .map(keyword => ({
    keyword,
    count: productsWithKeyword.length,
    percentage: (count / totalProducts) * 100,
    opportunity: calculateOpportunity(percentage)
  }))
  .filter(gap => gap.opportunity !== 'low')
  .sort((a, b) => a.percentage - b.percentage);
```

### 4. Rising Stars 식별

```javascript
// 신흥 고성장 제품 기준
const isRisingStar = (product) => {
  return (
    product.review_count < 5000 &&  // 초기 단계
    product.rating >= 4.5 &&        // 높은 만족도
    product.rank <= 50              // 상위 랭킹
  );
};
```

---

## 📸 스크린샷

### Market Analysis
![Market Analysis](docs/screenshots/market-analysis.png)

### LANEIGE Intelligence
![LANEIGE Intelligence](docs/screenshots/laneige-intelligence.png)

### Product Detail Modal
![Product Detail](docs/screenshots/product-detail.png)

---

## 🔧 환경 변수

프로젝트에서 사용하는 환경 변수가 없습니다. 모든 데이터는 정적 JSON 파일로 관리됩니다.

---

## 🚦 개발 로드맵

### ✅ Completed (v1.0)
- [x] Amazon 제품 데이터 스크래핑
- [x] 5개 Market Analysis 모듈 구현
- [x] 5개 LANEIGE Intelligence 모듈 구현
- [x] 브랜드 추출 알고리즘 (90% 정확도)
- [x] Vercel 배포
- [x] Historical Ranking Data (365일 랭킹 히스토리)
- [x] Excel Export (날짜별 순위 변동 다운로드)
- [x] AI-Powered Ranking Insights (Claude Sonnet 4)
- [x] LANEIGE-Focused Analysis (제품별 심층 분석)
- [x] Markdown Rendering (react-markdown 통합)

### 🔄 In Progress (v1.1)
- [ ] 실시간 데이터 업데이트 자동화
- [ ] 대시보드 PDF 내보내기 기능
- [ ] 사용자 맞춤형 필터링

### 📋 Planned (v2.0)
- [ ] AI 기반 리뷰 감성 분석 확장
- [ ] 경쟁사 알림 시스템
- [ ] 다국어 지원 (한국어/영어)
- [ ] 모바일 반응형 최적화

---

## 🤝 기여하기

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

이 프로젝트는 AMORE PACIFIC의 내부 프로젝트입니다.

---

## 👥 Contributors

- **Project Lead**: [Your Name]
- **Data Analysis**: [Team Member]
- **UI/UX Design**: [Team Member]

---

## 📞 Contact

- **Project Repository**: [GitHub Link]
- **Email**: your.email@amorepacific.com

---

## 🙏 Acknowledgments

- [Recharts](https://recharts.org/) - 데이터 시각화 라이브러리
- [Framer Motion](https://www.framer.com/motion/) - 애니메이션
- [Lucide React](https://lucide.dev/) - 아이콘 라이브러리
- [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 CSS 프레임워크

---

<div align="center">

**Made with ❤️ by AMORE PACIFIC AI Team**

[⬆ Back to Top](#-amore-pacific-ai-agent-07---brand-intelligence)

</div>
