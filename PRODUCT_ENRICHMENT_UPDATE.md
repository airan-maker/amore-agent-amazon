# Product Enrichment Update

## 문제점
Market Analysis 페이지에서 "상세 정보 수집 79 / 100" 메시지가 표시되며, 일부 제품의 상세 정보가 누락됨.

**원인:**
- 랭킹 수집: 500개 제품 (5개 카테고리 × 100개) - 기본 정보만 (rank, asin, name, rating, review_count)
- 상세 정보 수집: products.yaml에 설정된 19개 제품만
- **누락된 데이터:** brand, breadcrumb, images, description, features 등

## 해결 방법

### 1. 새로운 파이프라인 단계 추가
`main.py`에 **Step 3: Product Enrichment** 추가:

```
Step 1: Target products 상세 정보 수집 (19개)
Step 2: Best Sellers 랭킹 수집 (500개)
Step 3: 랭킹 제품 상세 정보 enrichment (500개) ⭐ NEW
Step 4: 리뷰 수집
Step 5: 데이터 저장 (enriched data 병합)
Step 6: M1 데이터 생성
Step 7: M2 데이터 생성
```

### 2. 설정 파일 추가
`scheduler_config.yaml`에 새로운 섹션 추가:

```yaml
# 제품 상세 정보 수집 설정
product_enrichment:
  # 활성화 여부
  enabled: true

  # 수집 전략
  # - "all": 모든 랭킹 제품 (500개) - 약 20-30분 소요
  # - "top_n": 카테고리별 상위 N개만
  # - "none": 수집 안함 (기존 방식)
  strategy: "all"

  # top_n 전략일 경우: 카테고리별 상위 몇 개
  top_n_per_category: 100

  # 실패 시 재시도 횟수
  max_retries_per_product: 2

  # 제품간 수집 간격 (초) - Rate limiting 방지
  delay_between_products: 2
```

### 3. 주요 기능

#### 3.1 자동 Product Enrichment
```python
async def enrich_ranked_products(self):
    """모든 랭킹 제품의 상세 정보 자동 수집"""
    - 설정된 전략에 따라 ASIN 선택
    - 각 제품 페이지 방문하여 상세 정보 수집
    - 재시도 로직 (실패 시 자동 재시도)
    - Rate limiting (제품간 delay)
    - 진행률 표시 (예상 소요 시간 포함)
```

#### 3.2 데이터 병합
```python
def save_raw_data(self):
    """랭킹 데이터 + 상세 정보 자동 병합"""
    - 랭킹 데이터 (rank, rating from list page)
    - 상세 정보 (brand, breadcrumb, images, description)
    - 최종 enriched data를 test_5_categories_*.json에 저장
```

## 수집되는 상세 정보

### 기존 (랭킹 수집만)
- rank
- asin
- product_name
- rating
- review_count
- product_url
- scraped_at

### 추가 (Enrichment 후)
- ✅ **brand** - 브랜드명
- ✅ **breadcrumb** - 카테고리 경로 (Beauty > Skin Care > ...)
- ✅ **category** - 메인 카테고리
- ✅ **images** - 제품 이미지 URL 리스트
- ✅ **description** - 제품 설명
- ✅ **features** - 주요 특징 (bullet points)
- ✅ **availability** - 재고 상태
- ✅ **price** (detailed) - 현재가, 정가 포함

## 실행 시간 예상

### Strategy: "all" (500개 제품)
- 제품당 평균 2-3초 (delay 포함)
- **총 소요 시간: 약 20-30분**
- 추천: 매일 11시 자동 수집에 적합

### Strategy: "top_n" (100개 제품 예시)
- **총 소요 시간: 약 5-8분**
- 추천: 빠른 업데이트가 필요한 경우

### Strategy: "none"
- 기존 방식 (enrichment 없음)
- 19개 제품만 상세 정보 수집

## 테스트 방법

### 1. 설정 확인
```bash
cat data-collector/config/scheduler_config.yaml
```

`product_enrichment.enabled: true` 확인

### 2. 수동 실행 테스트
```bash
cd data-collector
python main.py --mode full
```

### 3. 로그 확인
```
[STEP 3/7] Enriching rankings with detailed product information...
Enrichment strategy: all
Found 500 unique products to enrich
[1/500] Enriching product: B07MFMWFYL
  ✓ Enriched: MRS. MEYER'S CLEAN DAY Liquid Hand Soap Refill...
[2/500] Enriching product: B00VTE0ZLQ
  ✓ Enriched: AQUAPHOR Lip Repair Ointment...
...
Progress: 50/500 | Enriched: 48 | Failed: 2 | Skipped: 0
  Elapsed: ~1.7min | Remaining: ~15.0min
```

### 4. 결과 확인
```bash
# 최신 수집 파일 확인
ls -lh data-collector/output/test_5_categories_*.json | tail -1

# 제품 데이터 샘플 확인 (brand, breadcrumb 있는지)
python -c "
import json
data = json.load(open('data-collector/output/test_5_categories_20260108_210558.json'))
cat1 = list(data.values())[0]
product = cat1['products'][0]
print('Has brand:', 'brand' in product)
print('Has breadcrumb:', 'breadcrumb' in product)
print('Has images:', 'images' in product)
"
```

## 예상 결과

### Before (기존)
```
상세 정보 수집: 79 / 100 ❌
- Brand Intelligence 분석 불가능
- 누락된 카테고리 정보
```

### After (수정 후)
```
상세 정보 수집: 100 / 100 ✅
- 모든 제품의 brand, category, breadcrumb 정보 보유
- Brand Intelligence 분석 가능
- M1, M2 모듈 완전 작동
```

## 다음 단계

1. ✅ **설정 확인** - `scheduler_config.yaml` 확인
2. ⏳ **수동 테스트** - `python main.py --mode full` 실행
3. ⏳ **결과 검증** - 100/100 enrichment 확인
4. ⏳ **자동 스케줄러** - 내일 오전 11시 자동 실행 대기
5. ⏳ **대시보드 확인** - Market Analysis 페이지에서 상세 정보 확인

## 주의사항

### Rate Limiting
- Amazon이 너무 빠른 요청을 차단할 수 있음
- `delay_between_products: 2` (최소 2초 delay)
- 차단 발생 시: delay를 3-5초로 증가

### 실행 시간
- 500개 제품 enrichment: 약 20-30분
- 스케줄러 max_execution_time이 3600초(1시간)로 설정되어 충분함

### 실패 처리
- 일부 제품 실패해도 전체 파이프라인은 계속 진행
- 재시도 로직으로 일시적 오류 해결
- 최종 성공률이 로그에 표시됨

## 설정 변경 예시

### 빠른 테스트 (상위 20개만)
```yaml
product_enrichment:
  enabled: true
  strategy: "top_n"
  top_n_per_category: 20  # 총 100개 제품만
  delay_between_products: 1
```

### 전체 수집 (기본값)
```yaml
product_enrichment:
  enabled: true
  strategy: "all"  # 모든 500개 제품
  delay_between_products: 2
```

### Enrichment 비활성화
```yaml
product_enrichment:
  enabled: false  # 기존 방식 (19개만)
```
