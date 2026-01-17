# 프론트엔드 데이터 구조 가이드

이 문서는 `app/src/data/` 디렉토리의 데이터 파일 구조와 사용법을 설명합니다.

---

## 📁 디렉토리 구조

```
app/src/data/
├── category_products.json          # 카테고리별 제품 랭킹
├── product_details.json            # 상세 제품 정보
├── m1_breadcrumb_traffic.json      # M1: 브레드크럼 트래픽
├── m1_emerging_brands.json         # M1: 신흥 브랜드
├── m1_volatility_index.json        # M1: 변동성 지수
├── m2_intelligence_bridge.json     # M2: 인텔리전스 브리지
├── m2_usage_context.json           # M2: 사용 맥락
├── historical/                     # 시계열 데이터
│   └── test_5_categories_YYYYMMDD.json
├── legacy/                         # 레거시/백업 파일 (사용 안 함)
│   ├── README.md
│   └── *_backup_*.json (116개)
└── DATA_STRUCTURE.md               # 이 문서
```

---

## 📊 데이터 파일 상세

### 1. `category_products.json` (1.3 MB)

**목적**: Amazon 카테고리별 제품 랭킹 데이터

**구조**:
```json
{
  "Beauty & Personal Care": {
    "category": "Beauty & Personal Care",
    "url": "https://www.amazon.com/...",
    "success": true,
    "products_count": 100,
    "products": [
      {
        "rank": 1,
        "asin": "B09HN8JBFP",
        "product_name": "LANEIGE Water Sleeping Mask",
        "brand": "LANEIGE",
        "price": "$25.00",
        "rating": 4.7,
        "review_count": 5000,
        "breadcrumb": ["Beauty", "Skin Care", "Face"],
        "images": ["url1", "url2"],
        "features": ["Hydrating", "Overnight mask"],
        "availability": "In Stock"
      }
    ]
  }
}
```

**사용 위치**:
- `pages/LaneigeAIAgent.jsx`

**업데이트**: 매일 새벽 3:13 AM (자동)

---

### 2. `product_details.json` (5.6 MB)

**목적**: 전체 제품의 상세 정보 (과거 버전, 호환성 유지용)

**구조**:
```json
{
  "B09HN8JBFP": {
    "asin": "B09HN8JBFP",
    "brand": "LANEIGE",
    "product_name": "Water Sleeping Mask",
    "price": "$25.00",
    "rating": 4.7,
    "review_count": 5000,
    "breadcrumb": ["Beauty & Personal Care", "Skin Care"],
    "images": ["https://..."],
    "description": "...",
    "features": ["..."]
  }
}
```

**사용 위치**:
- `pages/AIMarketAnalysis.jsx`
- `pages/AIAgentDashboard.jsx`
- `pages/LaneigeAIAgent.jsx`
- `components/M1_BreadcrumbMapping.jsx`
- `components/M2_UsageContext.jsx`

**업데이트**: 수동 (필요 시)

---

### 3. `m1_breadcrumb_traffic.json` (6.5 KB)

**목적**: M1 모듈 - 브레드크럼 경로별 트래픽 분석

**구조**:
```json
{
  "products": {
    "B09HN8JBFP": {
      "name": "LANEIGE Water Sleeping Mask",
      "brand": "LANEIGE",
      "breadcrumb_distribution": {
        "Beauty → Face Moisturizers": 45.5,
        "Beauty → Night Creams": 35.2,
        "Beauty → Skincare": 19.3
      },
      "total_traffic_estimate": 15000
    }
  },
  "generated_at": "2026-01-10T12:40:00"
}
```

**사용 위치**:
- `pages/AIAgentDashboard.jsx`

**업데이트**: 매일 새벽 3:13 AM (자동)

---

### 4. `m1_volatility_index.json` (3.7 KB)

**목적**: M1 모듈 - 카테고리별 시장 변동성 지수

**구조**:
```json
{
  "categories": {
    "Face Moisturizers": {
      "volatility_score": 25.5,
      "trend": "stable",
      "rank_changes": [-2, 1, -3, 0, 2],
      "avg_change": 1.6
    }
  },
  "overall_market_volatility": 22.8,
  "generated_at": "2026-01-10T12:40:00"
}
```

**사용 위치**:
- `pages/AIAgentDashboard.jsx`

**업데이트**: 매일 새벽 3:13 AM (자동)

---

### 5. `m1_emerging_brands.json` (2.8 KB)

**목적**: M1 모듈 - 신흥 브랜드 탐지

**구조**:
```json
{
  "emerging_brands": [
    {
      "brand": "COSRX",
      "rank_improvement": 15,
      "growth_rate": 65.5,
      "category": "Face Moisturizers",
      "current_rank": 25,
      "previous_rank": 40
    }
  ],
  "generated_at": "2026-01-10T12:40:00"
}
```

**사용 위치**:
- `pages/AIAgentDashboard.jsx`

**업데이트**: 매일 새벽 3:13 AM (자동)

---

### 6. `m2_usage_context.json` (87 B)

**목적**: M2 모듈 - 제품 사용 맥락 분석 (리뷰 기반)

**구조**:
```json
{
  "products": {
    "B09HN8JBFP": {
      "usage_contexts": [
        {
          "context": "Hydration for dry skin",
          "key_phrases": ["dry skin", "hydrating", "moisturizing"],
          "sentiment_avg": 4.6,
          "mention_count": 450,
          "sample_reviews": ["..."]
        }
      ]
    }
  },
  "generated_at": "2026-01-10T12:40:00"
}
```

**사용 위치**:
- `pages/AIAgentDashboard.jsx`

**업데이트**: 매일 새벽 3:13 AM (자동)

---

### 7. `m2_intelligence_bridge.json` (7.6 KB)

**목적**: M2 모듈 - M1 시장 데이터 + M2 리뷰 인텔리전스 통합

**구조**:
```json
{
  "products": {
    "B09HN8JBFP": {
      "market_position": {
        "rank": 1,
        "volatility": "stable",
        "traffic_share": 15.5
      },
      "usage_insights": {
        "primary_use_case": "Overnight hydration",
        "sentiment": 4.7
      },
      "strategic_recommendations": [
        "Focus on hydration messaging",
        "Emphasize overnight benefits"
      ]
    }
  },
  "generated_at": "2026-01-10T02:48:00"
}
```

**사용 위치**:
- `pages/AIAgentDashboard.jsx`

**업데이트**: 매일 새벽 3:13 AM (자동)

---

## 📂 Historical 폴더

### `historical/test_5_categories_YYYYMMDD.json`

**목적**: 일자별 시계열 데이터 (트렌드 분석용)

**구조**: `category_products.json`과 동일

**파일 예시**:
```
test_5_categories_20260101.json
test_5_categories_20260102.json
test_5_categories_20260110.json
```

**사용 위치**:
- 현재 사용하지 않음 (향후 시계열 차트용)

**보관 기간**: 30일 (자동 정리)

---

## 🗂️ Legacy 폴더

### 목적
프론트엔드에서 더 이상 사용하지 않는 백업 및 레거시 파일 보관

### 내용
- 백업 파일들 (116개): `*_backup_*.json`
- OLD 파일들 (3개): `*_OLD.json`
- 개발/테스트 파일들 (5개)

### 안전한 삭제
Legacy 폴더의 모든 파일은 프론트엔드에서 사용하지 않으므로 안전하게 삭제 가능합니다.

**자세한 내용**: `legacy/README.md` 참조

---

## 🔄 데이터 업데이트 흐름

```
┌─────────────────────────────────────────────────┐
│  1. Data Collector (매일 03:13 AM)              │
│     - Amazon 스크래핑                           │
│     - 랭킹, 제품, 리뷰 수집                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  2. Data Processing                             │
│     - M1 데이터 생성 (시장 분석)                │
│     - M2 데이터 생성 (리뷰 인텔리전스)          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  3. Data Copy to Frontend                       │
│     - data-collector/output/ → app/src/data/    │
│     - 백업 파일 자동 생성                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  4. Frontend Display                            │
│     - React 컴포넌트에서 데이터 로드            │
│     - 대시보드 업데이트                         │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ 유지보수 가이드

### 정기 작업 (월 1회)

#### 1. Legacy 폴더 정리
```bash
cd data-collector
python utils/cleanup_legacy.py --delete-old-backups 30
```

#### 2. 디스크 공간 확인
```bash
cd app/src/data
du -sh *
```

#### 3. Historical 데이터 정리 (30일 이상)
```bash
cd app/src/data/historical
find . -name "*.json" -mtime +30 -delete
```

### 자동화 스크립트

**cleanup_legacy.py** - Legacy 파일 자동 정리
```bash
# 기본 사용법 (백업 파일을 legacy로 이동)
python utils/cleanup_legacy.py

# 30일 이상 된 백업 삭제
python utils/cleanup_legacy.py --delete-old-backups 30

# Dry run (실제로 수행하지 않고 확인만)
python utils/cleanup_legacy.py --dry-run
```

---

## ⚠️ 주의사항

### 절대 삭제하면 안 되는 파일들

✅ **현재 사용 중인 7개 파일**:
- `category_products.json`
- `product_details.json`
- `m1_breadcrumb_traffic.json`
- `m1_emerging_brands.json`
- `m1_volatility_index.json`
- `m2_intelligence_bridge.json`
- `m2_usage_context.json`

✅ **Historical 폴더**: 시계열 분석에 사용

### 안전하게 삭제 가능한 파일들

❌ **Legacy 폴더**: 전체 삭제 가능
- 백업 파일들 (모두 안전)
- OLD 파일들 (모두 안전)
- 임시 파일들 (모두 안전)

---

## 📊 파일 크기 및 성능

| 파일 | 크기 | 로딩 시간 | 최적화 |
|------|------|-----------|--------|
| `category_products.json` | 1.3 MB | ~50ms | ✅ 적정 |
| `product_details.json` | 5.6 MB | ~200ms | ⚠️ 큼 |
| `m1_breadcrumb_traffic.json` | 6.5 KB | <10ms | ✅ 최적 |
| `m1_emerging_brands.json` | 2.8 KB | <10ms | ✅ 최적 |
| `m1_volatility_index.json` | 3.7 KB | <10ms | ✅ 최적 |
| `m2_intelligence_bridge.json` | 7.6 KB | <10ms | ✅ 최적 |
| `m2_usage_context.json` | 87 B | <5ms | ✅ 최적 |

### product_details.json 최적화 권장

`product_details.json`이 5.6MB로 큰 편입니다. 향후 최적화 고려사항:
1. 사용하지 않는 필드 제거
2. 이미지 URL을 별도 파일로 분리
3. Lazy loading 구현
4. API 엔드포인트로 변경

---

## 🔍 트러블슈팅

### Q: 프론트엔드에 데이터가 안 보여요!

**A**: 파일 존재 여부 확인
```bash
cd app/src/data
ls -lh *.json
```

모든 7개 파일이 있어야 합니다. 없으면 데이터 수집 재실행:
```bash
cd data-collector
python main.py --mode full
```

### Q: Legacy 폴더가 너무 커졌어요!

**A**: 오래된 백업 삭제
```bash
python utils/cleanup_legacy.py --delete-old-backups 30
```

### Q: 데이터가 오래되었어요!

**A**: 수동 업데이트
```bash
cd data-collector
python main.py --mode full
python utils/data_copier.py
```

---

## 📞 문의

데이터 구조나 파일에 대한 문의는 개발팀에 연락하세요.

**관련 문서**:
- `legacy/README.md` - Legacy 파일 상세 설명
- `data-collector/IMPROVEMENTS.md` - 데이터 수집 개선 사항
- `data-collector/CACHE_GUIDE.md` - 캐싱 시스템 가이드
