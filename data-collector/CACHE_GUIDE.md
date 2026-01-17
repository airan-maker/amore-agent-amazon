# 캐시 시스템 사용 가이드

## 📦 캐시란?

수집한 제품 데이터를 로컬에 저장해서, 다음 실행 시 Amazon 스크래핑 없이 바로 불러올 수 있는 시스템입니다.

---

## 🎯 언제 유용한가요?

### 1. **일일 스케줄 실행**
- 매일 새벽 3시 13분 자동 실행
- 전날 수집한 데이터가 24시간 이내면 캐시 활용
- **예상 시간**: 17분 → **30초**

### 2. **개발/테스트 중**
- 같은 날 여러 번 실행 시
- 불필요한 스크래핑 방지
- Amazon 차단 위험 감소

### 3. **부분 실패 복구**
- 중간에 실패해도 이미 수집한 데이터는 캐시에 보존
- 재실행 시 성공한 부분은 건너뛰기

---

## ✅ 지금 방금 한 작업

### 기존 데이터를 캐시로 저장 완료!

```
✓ 캐시된 제품: 397개
✓ 캐시 파일 크기: 1,127.3 KB
✓ 캐시 유효 기간: 24시간 (2026-01-11 17:23까지)
✓ 예상 시간 절약: ~2분 (다음 실행 시)
```

**캐시 위치**: `data/cache/products_cache.json`

---

## 🚀 사용 방법

### 자동으로 작동합니다!

아무것도 안 해도 됩니다. 다음 실행 시 자동으로:

1. 캐시 확인
2. 유효한 데이터 있으면 사용
3. 없거나 만료되면 스크래핑

### 로그 예시

**캐시 히트** (스크래핑 안 함):
```
[1/500] 💾 B09HN8JBFP - Loaded from cache
```

**캐시 미스** (새로 스크래핑):
```
[1/500] ✓ B09HN8JBFP - LANEIGE Water Sleeping Mask
```

---

## 🔧 수동 캐시 관리

### 기존 데이터를 캐시로 가져오기

```bash
cd data-collector
python utils/import_to_cache.py
```

**언제 사용?**:
- 데이터를 새로 수집한 후
- 다음 실행 시 시간을 절약하고 싶을 때
- 방금 막 했습니다!

### 캐시 삭제 (강제 재수집)

```bash
cd data-collector
python -c "from utils.cache_manager import CacheManager; from config.settings import DATA_DIR; c = CacheManager(DATA_DIR / 'cache'); c.clear_all(); print('Cache cleared!')"
```

**언제 사용?**:
- 제품 정보가 크게 바뀌었을 때
- 캐시가 손상되었을 때
- 강제로 전체 재수집하고 싶을 때

### 만료된 캐시만 삭제

```bash
cd data-collector
python -c "from utils.cache_manager import CacheManager; from config.settings import DATA_DIR; c = CacheManager(DATA_DIR / 'cache'); c.clear_expired(); print('Expired cache cleared!')"
```

자동으로 매 실행 시 수행됩니다.

### 캐시 통계 확인

```bash
cd data-collector
python -c "from utils.cache_manager import CacheManager; from config.settings import DATA_DIR; import json; c = CacheManager(DATA_DIR / 'cache'); print(json.dumps(c.get_stats(), indent=2))"
```

**출력 예시**:
```json
{
  "total_entries": 397,
  "valid_entries": 397,
  "expired_entries": 0,
  "cache_ttl_hours": 24.0
}
```

---

## ⚙️ 캐시 설정

### 유효 기간 변경

`config/scheduler_config.yaml`:
```yaml
cache:
  ttl_hours: 24  # 24시간 → 48시간으로 변경 가능
```

**추천 값**:
- **24시간** (기본): 매일 신선한 데이터
- **12시간**: 하루 2번 수집 시
- **48시간**: 변화가 적은 제품일 때

---

## 📊 오늘 새벽 실행 시나리오

### 시나리오: 2026-01-11 03:13 AM 자동 실행

**지금 상태**:
- ✅ 397개 제품 캐시됨 (2026-01-10 17:23)
- ✅ 캐시 유효: ~10시간 남음

**예상 동작**:
1. 랭킹 수집 (~30초)
2. 제품 정보 보강:
   - 397개 → 💾 캐시에서 로드 (~5초)
   - 나머지 새 제품 → ✓ 스크래핑 (~1-2분)
3. 리뷰 수집 (~30초)
4. 데이터 생성 (~10초)

**총 예상 시간**: ~2-3분 (캐시 없으면 ~20분)

---

## 💡 최적화 팁

### 1. 매일 수집 후 캐시 가져오기

스케줄러 실행 후:
```bash
python utils/import_to_cache.py
```

다음 날 실행 시간을 크게 단축합니다.

### 2. 자동화 스크립트

`scheduler.py`에 자동으로 캐시 import를 추가할 수 있습니다:
```python
# main.py 실행 후
subprocess.run(["python", "utils/import_to_cache.py"])
```

### 3. 캐시 모니터링

주기적으로 캐시 통계를 확인해서 정상 작동하는지 체크:
```bash
python -c "from utils.cache_manager import CacheManager; from config.settings import DATA_DIR; c = CacheManager(DATA_DIR / 'cache'); s = c.get_stats(); print(f'Valid: {s[\"valid_entries\"]}/{s[\"total_entries\"]}')"
```

---

## 🔍 문제 해결

### Q: 캐시를 사용하는데도 계속 스크래핑하네요?

**A**: 캐시가 만료되었을 수 있습니다.
```bash
# 캐시 통계 확인
python -c "from utils.cache_manager import CacheManager; from config.settings import DATA_DIR; c = CacheManager(DATA_DIR / 'cache'); print(c.get_stats())"
```

### Q: 캐시 파일이 너무 커요!

**A**: 만료된 항목을 정리하세요.
```bash
python -c "from utils.cache_manager import CacheManager; from config.settings import DATA_DIR; c = CacheManager(DATA_DIR / 'cache'); c.clear_expired()"
```

### Q: 특정 제품만 재수집하고 싶어요!

**A**: 해당 ASIN을 캐시에서 삭제:
```python
from utils.cache_manager import CacheManager
from config.settings import DATA_DIR

cache = CacheManager(DATA_DIR / 'cache')
# 특정 ASIN 삭제
if 'B09HN8JBFP' in cache.cache_data:
    del cache.cache_data['B09HN8JBFP']
    cache._save_cache()
```

### Q: 캐시가 손상된 것 같아요!

**A**: 전체 캐시 삭제 후 재수집:
```bash
python -c "from utils.cache_manager import CacheManager; from config.settings import DATA_DIR; c = CacheManager(DATA_DIR / 'cache'); c.clear_all()"
```

---

## 📈 성능 비교

| 상황 | 캐시 없음 | 캐시 있음 | 절약 |
|------|-----------|-----------|------|
| **전체 재수집** | 17분 | 17분 | - |
| **일부만 변경** | 17분 | 2-3분 | **85%** |
| **같은 날 재실행** | 17분 | 30초 | **97%** |
| **Amazon 요청 수** | 500회 | 50-100회 | **80-90%** |

---

## 🎉 요약

### 방금 완료한 작업
✅ **397개 제품**을 캐시에 저장했습니다!

### 다음 실행 (오늘 새벽 03:13) 시
- 💾 397개는 캐시에서 즉시 로드
- ✓ 새로운 제품만 스크래핑
- ⏱️ **예상 시간: 2-3분** (기존 17분 대비 85% 단축)

### 이후 매일
- 자동으로 캐시 활용
- 24시간 이내 데이터는 재사용
- Amazon 부하 감소 → 차단 위험 감소

---

**모든 것이 자동으로 작동합니다!** 🚀

추가 질문이 있으시면 언제든지 물어보세요!
