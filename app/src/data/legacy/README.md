# Legacy Data Files

이 폴더는 프론트엔드에서 더 이상 사용하지 않는 레거시 데이터 파일들을 보관합니다.

## 📁 정리 일시

- **정리 날짜**: 2026-01-10
- **총 파일 수**: 124개

---

## 📋 파일 분류

### 1. 백업 파일들 (116개)
모든 `*_backup_YYYYMMDD_HHMMSS.json` 파일들

**설명**:
- 데이터 복사 시 자동 생성된 백업 파일들
- 과거 시점의 스냅샷
- 프론트엔드에서 직접 사용하지 않음

**파일 예시**:
```
category_products_backup_20260110_124052.json
m1_breadcrumb_traffic_backup_20260110_124052.json
m1_emerging_brands_backup_20260110_124052.json
m1_volatility_index_backup_20260110_124052.json
m2_intelligence_bridge_backup_20260110_124052.json
m2_usage_context_backup_20260110_124052.json
```

### 2. OLD 파일들 (3개)
이전 버전의 데이터 파일들

**파일 목록**:
- `m1_breadcrumb_traffic_OLD.json`
- `m2_intelligence_bridge_OLD.json`
- `m2_usage_context_OLD.json`

### 3. 개발/테스트 파일들 (5개)
개발 과정에서 생성된 임시 파일들

**파일 목록**:
- `products_for_ai_generation.json` - AI 생성을 위한 제품 리스트
- `products_list.json` - 제품 목록 (구버전)
- `extracted_reviews.json` - 추출된 리뷰 데이터
- `check_products.py` - 제품 체크 스크립트
- `temp_products.txt` - 임시 제품 데이터

---

## ✅ 현재 사용 중인 파일들 (상위 폴더)

프론트엔드에서 실제로 사용하는 파일들:

### 데이터 파일 (7개)
```
📂 app/src/data/
  ├── category_products.json          (1.3 MB) - 카테고리별 제품 랭킹
  ├── product_details.json            (5.6 MB) - 상세 제품 정보
  ├── m1_breadcrumb_traffic.json      (6.5 KB) - M1: 브레드크럼 트래픽
  ├── m1_emerging_brands.json         (2.8 KB) - M1: 신흥 브랜드
  ├── m1_volatility_index.json        (3.7 KB) - M1: 변동성 지수
  ├── m2_intelligence_bridge.json     (7.6 KB) - M2: 인텔리전스 브리지
  └── m2_usage_context.json           (87 B)   - M2: 사용 맥락
```

### 사용 위치
| 파일 | 사용 컴포넌트 |
|------|--------------|
| `category_products.json` | `LaneigeAIAgent.jsx` |
| `product_details.json` | `AIMarketAnalysis.jsx`, `AIAgentDashboard.jsx`, `LaneigeAIAgent.jsx`, `M1_BreadcrumbMapping.jsx`, `M2_UsageContext.jsx` |
| `m1_breadcrumb_traffic.json` | `AIAgentDashboard.jsx` |
| `m1_emerging_brands.json` | `AIAgentDashboard.jsx` |
| `m1_volatility_index.json` | `AIAgentDashboard.jsx` |
| `m2_intelligence_bridge.json` | `AIAgentDashboard.jsx` |
| `m2_usage_context.json` | `AIAgentDashboard.jsx` |

### Historical 폴더
```
📂 app/src/data/historical/
  └── test_5_categories_YYYYMMDD.json (일자별 시계열 데이터)
```

---

## 🗑️ 파일 삭제 가이드

### 언제 삭제해도 안전한가요?

**즉시 삭제 가능**:
- ✅ 백업 파일들 (`*_backup_*.json`) - 모두 안전하게 삭제 가능
- ✅ 임시 파일들 (`temp_*.txt`, `check_*.py`) - 개발용 임시 파일

**신중하게 판단**:
- ⚠️ OLD 파일들 - 이전 버전과 비교가 필요한 경우 보관
- ⚠️ `extracted_reviews.json` - 리뷰 분석 참고가 필요한 경우 보관

### 디스크 공간 확보가 필요하면?

1. **백업 파일 전체 삭제** (권장):
   ```bash
   cd app/src/data/legacy
   rm -f *_backup_*.json
   ```

2. **30일 이상 된 백업만 삭제**:
   ```bash
   cd app/src/data/legacy
   find . -name "*_backup_2026010*.json" -mtime +30 -delete
   ```

3. **전체 legacy 폴더 삭제** (신중히):
   ```bash
   cd app/src/data
   rm -rf legacy/
   ```

---

## 📊 디스크 사용량

```bash
# Legacy 폴더 크기 확인
du -sh legacy/

# 백업 파일들 크기
du -sh legacy/*_backup_*.json

# 가장 큰 파일 10개 확인
ls -lhS legacy/ | head -11
```

---

## 🔄 복원이 필요하면?

특정 시점의 데이터를 복원하고 싶은 경우:

```bash
# 특정 백업 파일을 상위 폴더로 복사
cp legacy/category_products_backup_20260110_124052.json ../category_products.json
```

---

## 📝 관리 권장사항

### 주기적 정리 (월 1회)
1. Legacy 폴더 크기 확인
2. 30일 이상 된 백업 파일 삭제
3. 필요 없는 임시 파일 제거

### 자동화 스크립트
`utils/cleanup_legacy.py` 스크립트를 사용하면 자동으로 오래된 파일을 정리할 수 있습니다.

---

## ⚠️ 주의사항

- **Historical 폴더는 건드리지 마세요!** 시계열 분석에 사용됩니다.
- 현재 사용 중인 7개 파일 (상위 폴더)도 삭제하지 마세요.
- Legacy 폴더의 파일들은 프론트엔드에서 참조하지 않으므로 삭제해도 앱이 정상 작동합니다.

---

## 📞 문의

정리된 파일에 대한 문의나 복원이 필요한 경우 개발팀에 문의하세요.
