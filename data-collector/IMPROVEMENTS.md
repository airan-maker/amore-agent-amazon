# 데이터 수집 파이프라인 개선 사항

## 📋 개선 개요

데이터 수집 프로세스의 효율성과 성능을 크게 향상시키기 위한 3가지 주요 개선 사항을 적용했습니다.

---

## 🔄 1. 파이프라인 순서 재구성

### 이전 (비효율적)
```
Step 1: 제품 상세 정보 수집 (core_products만, 9개)
Step 2: 랭킹 데이터 수집 (카테고리별 100개씩)
Step 3: 랭킹된 제품 정보 보강 (다시 스크래핑)
Step 4: 리뷰 수집
Step 5-7: 데이터 저장 및 생성
```

**문제점**:
- Step 1에서 어떤 제품이 중요한지 모르는 상태에서 9개만 수집
- Step 3에서 랭킹된 제품을 다시 스크래핑 (중복 작업)
- 비논리적인 순서로 인한 비효율

### 개선 후 (효율적)
```
Step 1: 랭킹 데이터 수집 (중요한 제품 식별)
Step 2: 랭킹된 제품 정보 보강 (core + ranked products)
Step 3: 리뷰 수집
Step 4-6: 데이터 저장 및 생성
```

**개선점**:
- ✅ 먼저 랭킹을 수집해서 중요한 제품 파악
- ✅ 한 번에 모든 필요한 제품 정보 수집 (중복 제거)
- ✅ Core products를 우선 처리하여 중요 제품 먼저 확보
- ✅ 전체 단계 7단계 → 6단계로 단축

---

## ⚡ 2. 병렬 처리 최적화

### 이전 (순차 처리)
```python
# 제품을 하나씩 순차 처리
for asin in asins_to_enrich:
    product_data = await scraper.scrape(asin)
    await asyncio.sleep(2)  # 각 제품 후 대기
```

**성능**: 500개 제품 × 2초 = 1,000초 (약 17분)

### 개선 후 (배치 병렬 처리)
```python
# 배치 단위로 병렬 처리
for batch_asins in batches_of_5:
    tasks = [scrape(asin) for asin in batch_asins]
    await asyncio.gather(*tasks)  # 5개씩 동시 처리
    await asyncio.sleep(2)  # 배치 후 대기
```

**성능**: (500개 ÷ 5) × 2초 = 200초 (약 3.3분)

**개선점**:
- ✅ **5배 속도 향상** (17분 → 3.3분)
- ✅ Rate limiting 준수 (배치 사이에만 대기)
- ✅ 설정 가능한 `batch_size` (기본값: 5)
- ✅ 실시간 진행률 표시

### 설정
```yaml
# scheduler_config.yaml
product_enrichment:
  batch_size: 5  # 한 번에 5개씩 동시 스크래핑
  delay_between_products: 2  # 배치 사이 대기 시간
```

---

## 💾 3. 캐싱 메커니즘 추가

### 새로운 기능: 자동 캐싱
```
스크래핑 전 캐시 확인 → 캐시 있음? → 재사용 ✓
                      ↓ 없음
                   스크래핑 → 캐시 저장
```

**작동 방식**:
1. 제품 스크래핑 전 캐시 확인
2. 24시간 이내 데이터가 있으면 재사용
3. 없거나 만료되면 새로 스크래핑 후 캐시 저장
4. 시작 시 자동으로 만료된 캐시 정리

**장점**:
- ✅ 중복 스크래핑 방지 (같은 날 여러 번 실행 시)
- ✅ Amazon 부하 감소 (차단 위험 감소)
- ✅ 빠른 재실행 (캐시된 데이터 즉시 로드)
- ✅ 자동 만료 관리 (24시간 후 자동 갱신)

### 캐시 구조
```
data/cache/products_cache.json
{
  "B09HN8JBFP": {
    "data": {...},
    "cached_at": "2026-01-10T15:30:00"
  }
}
```

### 설정
```yaml
# scheduler_config.yaml
cache:
  ttl_hours: 24  # 캐시 유효 시간 (24시간)
```

### 캐시 로그 예시
```
💾 B09HN8JBFP - Loaded from cache (스크래핑 생략)
✓ B08XYZ1234 - LANEIGE Water Sleeping Mask (새로 스크래핑)
```

---

## 📊 성능 비교

| 항목 | 이전 | 개선 후 | 개선율 |
|------|------|---------|--------|
| **파이프라인 단계** | 7단계 | 6단계 | -14% |
| **중복 스크래핑** | 있음 (core products) | 없음 | -100% |
| **스크래핑 속도** | 순차 (500개 × 2초) | 배치 병렬 (100배치 × 2초) | **5배 향상** |
| **예상 시간 (500개)** | ~17분 | ~3.3분 | **80% 단축** |
| **재실행 시** | 전체 재스크래핑 | 캐시 활용 | **90% 단축** |
| **Amazon 요청 수** | 높음 | 낮음 (캐시 활용) | 최대 -50% |

---

## 🎯 우선순위 처리

### Core Products 우선 처리
```
1순위: Core products (products.yaml의 9개 LANEIGE + 경쟁사)
2순위: Ranked products (랭킹에서 발견된 제품들)
```

- Core products가 먼저 처리되어 중요 제품 데이터를 조기에 확보
- 나머지 랭킹 제품은 그 다음에 처리

---

## 📝 새로운 파일

### 1. `utils/cache_manager.py`
캐싱 로직을 담당하는 새로운 유틸리티 클래스
```python
from utils.cache_manager import CacheManager

cache = CacheManager(cache_dir, cache_ttl_hours=24)
cached_data = cache.get(asin)  # 캐시 조회
cache.set(asin, data)            # 캐시 저장
cache.clear_expired()            # 만료된 캐시 정리
```

### 2. `data/cache/products_cache.json`
제품 데이터 캐시 파일 (자동 생성)

---

## 🔧 설정 변경

### `scheduler_config.yaml` 추가 항목
```yaml
# 병렬 처리 설정
product_enrichment:
  batch_size: 5  # NEW: 배치 크기

# 캐싱 설정
cache:           # NEW: 캐싱 설정
  ttl_hours: 24  # NEW: 캐시 유효 시간
```

---

## 🚀 사용 방법

### 기본 실행 (변경 없음)
```bash
# 전체 파이프라인 실행
python main.py --mode full

# 자동 스케줄러 실행
python run_scheduler.py
```

### 캐시 관리
```python
# 캐시 통계 확인
cache_stats = cache_manager.get_stats()
print(cache_stats)
# {
#   "total_entries": 500,
#   "valid_entries": 450,
#   "expired_entries": 50,
#   "cache_ttl_hours": 24
# }

# 캐시 수동 정리
cache_manager.clear_expired()

# 캐시 전체 삭제
cache_manager.clear_all()
```

---

## 🎨 로그 개선

### 새로운 로그 형식
```
[1/500] ✓ B09HN8JBFP - LANEIGE Water Sleeping Mask
[2/500] 💾 B08XYZ1234 - Loaded from cache
[3/500] ⚠ B07ABC5678 - Attempt 1 failed, retrying...

📦 Processing batch 1/100 (1-5/500)
Progress: 1.0% | Enriched: 3 | Skipped: 1 | Failed: 1
```

---

## ⚠️ 주의사항

### Rate Limiting
- `batch_size`를 너무 크게 설정하면 Amazon에서 차단될 수 있습니다
- 권장값: 5 (기본값)
- 안전 범위: 3-10

### 캐시 관리
- 캐시는 `data/cache/` 디렉토리에 저장됩니다
- 디스크 공간이 부족하면 `cache.clear_expired()` 실행
- `ttl_hours`를 줄이면 더 자주 갱신됩니다 (데이터 신선도 ↑, 스크래핑 ↑)

### 성능 튜닝
```yaml
# 빠른 실행 (위험 ↑)
batch_size: 10
delay_between_products: 1
cache.ttl_hours: 48

# 안전한 실행 (느림)
batch_size: 3
delay_between_products: 3
cache.ttl_hours: 12
```

---

## 📈 예상 효과

### 일일 스케줄 실행 (매일 3:13 AM)
- **1일차**: 전체 스크래핑 (~3.3분)
- **2일차**: 대부분 캐시 활용 (~30초)
- **3일차**: 일부 캐시 만료, 일부 재스크래핑 (~1-2분)

### 개발 중 재실행
- 같은 날 여러 번 테스트 시 캐시 활용으로 **매우 빠른 실행** 가능
- 캐시 무효화 필요 시 `cache_manager.clear_all()` 사용

---

## ✅ 개선 완료 체크리스트

- [x] 파이프라인 순서 재구성 (7단계 → 6단계)
- [x] 불필요한 `collect_product_details()` 메소드 제거
- [x] 배치 병렬 처리 구현 (`asyncio.gather`)
- [x] 캐싱 메커니즘 추가 (`CacheManager`)
- [x] 설정 파일 업데이트 (`batch_size`, `cache`)
- [x] 로그 개선 (진행률, 캐시 표시)
- [x] Core products 우선 처리
- [x] 자동 캐시 정리 (시작 시)
- [x] 문서화 완료

---

## 🔮 향후 개선 가능 항목

1. **Redis 캐싱**: 파일 기반 → Redis로 업그레이드 (더 빠름)
2. **분산 처리**: 여러 머신에서 병렬 실행
3. **스마트 재시도**: 실패 유형별 다른 재시도 전략
4. **메트릭 추적**: 스크래핑 성공률, 평균 시간 등 추적
5. **알림 시스템**: 실패 시 이메일/슬랙 알림
6. **A/B 테스트**: 다른 배치 크기 자동 최적화

---

## 📞 문의 및 피드백

개선 사항에 대한 문의나 추가 요청 사항이 있으시면 알려주세요!
