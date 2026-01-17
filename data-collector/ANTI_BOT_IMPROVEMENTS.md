# Amazon 봇 탐지 회피 - 스크래핑 개선사항

**날짜**: 2026년 1월 10일
**상태**: ✅ 개선 완료

---

## 문제점

일부 카테고리에서 Amazon 봇 탐지로 인해 제품 수집 실패:
- **Perfumes & Fragrances**: 0개 제품
- **Foot, Hand & Nail Care**: 0개 제품
- **에러 메시지**: `net::ERR_ABORTED`

---

## 적용된 개선사항

### 1. 브라우저 핑거프린트 랜덤화 ✅

**파일**: `scrapers/base_scraper.py`, `config/settings.py`

**변경 사항**:
- ✅ **Viewport 랜덤화**: 7가지 다른 화면 크기 풀에서 선택
- ✅ **Timezone 랜덤화**: 6개 미국 시간대 중 랜덤 선택
- ✅ **Locale 랜덤화**: en-US, en-GB 중 선택
- ✅ **User-Agent 랜덤화**: 기존 20개 풀 유지

```python
VIEWPORT_POOL = [
    {"width": 1920, "height": 1080},  # Full HD
    {"width": 1680, "height": 1050},  # WSXGA+
    {"width": 1600, "height": 900},   # HD+
    {"width": 1440, "height": 900},   # WXGA+
    {"width": 1366, "height": 768},   # HD Common Laptop
    {"width": 1536, "height": 864},   # Common Laptop
    {"width": 2560, "height": 1440},  # QHD
]

TIMEZONE_POOL = [
    "America/New_York",      # EST
    "America/Chicago",       # CST
    "America/Denver",        # MST
    "America/Los_Angeles",   # PST
    "America/Phoenix",       # MST (no DST)
    "America/Seattle",       # PST
]
```

**효과**: 매번 다른 기기/지역에서 접속하는 것처럼 보임

---

### 2. 인간 행동 시뮬레이션 ✅

**파일**: `scrapers/base_scraper.py`

**새로운 메서드**:

#### a) `simulate_human_scroll(smooth=True)`
- 인간처럼 부드럽게 스크롤
- 5-10단계로 나누어 스크롤
- 각 스크롤 간 0.3-0.8초 대기

```python
async def simulate_human_scroll(self, smooth: bool = True):
    if smooth:
        scroll_steps = random.randint(5, 10)
        for i in range(scroll_steps):
            await self.page.evaluate(f"window.scrollTo({{top: {scroll_y}, behavior: 'smooth'}})")
            await asyncio.sleep(random.uniform(0.3, 0.8))
```

#### b) `simulate_mouse_movement()`
- 랜덤 마우스 이동 (2-4회)
- 각 이동 간 0.1-0.3초 대기

```python
async def simulate_mouse_movement(self):
    for _ in range(random.randint(2, 4)):
        x = random.randint(100, 800)
        y = random.randint(100, 600)
        await self.page.mouse.move(x, y)
        await asyncio.sleep(random.uniform(0.1, 0.3))
```

#### c) `simulate_human_reading()`
- 페이지 읽기 시간 시뮬레이션 (2-5초)

```python
async def simulate_human_reading(self):
    reading_time = random.uniform(2, 5)
    await asyncio.sleep(reading_time)
```

#### d) `_simulate_human_behavior()`
- 페이지 로딩 후 자동 실행
- 70% 확률로 스크롤, 50% 확률로 마우스 이동

**효과**: 실제 사용자처럼 페이지를 탐색

---

### 3. 요청 간 딜레이 증가 ✅

**파일**: `config/settings.py`

**변경 전**:
```python
"delay_min": 3,    # 최소 3초
"delay_max": 5,    # 최대 5초
```

**변경 후**:
```python
"delay_min": 5,    # 최소 5초 (67% 증가)
"delay_max": 10,   # 최대 10초 (100% 증가)
```

**효과**: 요청 속도를 낮춰 봇 탐지 확률 감소

---

### 4. 카테고리 간 긴 딜레이 ✅

**파일**: `config/settings.py`, `main.py`

**새로운 설정**:
```python
"category_delay_min": 15,  # 최소 15초
"category_delay_max": 30,  # 최대 30초
```

**main.py 변경**:
```python
# 배치 간 랜덤 딜레이 적용
batch_delay = random.uniform(category_delay_min, category_delay_max)
logger.info(f"⏱️  다음 배치까지 {batch_delay:.1f}초 대기 (봇 탐지 회피)...")
await asyncio.sleep(batch_delay)
```

**효과**: 카테고리 수집 간 충분한 휴식 시간으로 봇 플래그 방지

---

### 5. 재시도 로직 강화 ✅

**파일**: `scrapers/base_scraper.py`, `config/settings.py`

**개선 사항**:
- ✅ **재시도 횟수 증가**: 3회 → 5회
- ✅ **Exponential Backoff**: 재시도마다 대기 시간 2배 증가
- ✅ **특수 에러 처리**:
  - `ERR_ABORTED` / `ERR_FAILED`: 20-40초 추가 대기
  - `503 Service Unavailable`: 자동 재시도
  - `Timeout`: networkidle → load로 전환 후 재시도

```python
for attempt in range(max_retries):
    try:
        # ... 페이지 로딩 ...
    except Exception as e:
        if "ERR_ABORTED" in str(e):
            # 봇 탐지 가능성 - 긴 대기
            extra_delay = random.uniform(20, 40)
            await asyncio.sleep(extra_delay)
            continue

        # Exponential backoff
        backoff_delay = retry_delay * (2 ** attempt)
        await asyncio.sleep(backoff_delay)
```

**효과**: 일시적인 오류 및 봇 탐지도 재시도로 극복

---

### 6. 페이지 로딩 전략 개선 ✅

**파일**: `scrapers/base_scraper.py`

**변경 사항**:
- ✅ **기본 대기 전략**: `networkidle` → `load`로 변경
  - `networkidle`은 종종 타임아웃 발생
  - `load`는 더 빠르고 안정적
- ✅ **타임아웃 증가**: 60초 → 90초
- ✅ **페이지 로딩 후 추가 대기**: 인간 행동 시뮬레이션

**효과**: 타임아웃 에러 감소, 안정적인 페이지 로딩

---

### 7. 쿠키 저장/로딩 기능 추가 ✅

**파일**: `scrapers/base_scraper.py`

**새로운 메서드**:
```python
async def save_cookies(self, filepath: str):
    """브라우저 쿠키 저장"""

async def load_cookies(self, filepath: str):
    """브라우저 쿠키 로드"""
```

**효과**: 세션 유지로 반복 방문 시 의심 감소 (향후 활용 가능)

---

## 적용 결과 예상

### Before (개선 전)
```
❌ Perfumes & Fragrances: 0개 제품 (ERR_ABORTED)
❌ Foot, Hand & Nail Care: 0개 제품 (ERR_ABORTED)
⚡ 카테고리 간 딜레이: 5초
⚡ 요청 간 딜레이: 3-5초
⚡ 재시도: 3회
```

### After (개선 후)
```
✅ Perfumes & Fragrances: 100개 제품 예상
✅ Foot, Hand & Nail Care: 100개 제품 예상
⚡ 카테고리 간 딜레이: 15-30초 (랜덤)
⚡ 요청 간 딜레이: 5-10초 (랜덤)
⚡ 재시도: 5회 (Exponential backoff)
⚡ 인간 행동 시뮬레이션: 스크롤, 마우스, 읽기 시간
⚡ 브라우저 핑거프린트: 완전 랜덤화
```

---

## 성능 영향

### 수집 시간 변화

**24개 카테고리 전체 수집 시**:

| 항목 | 개선 전 | 개선 후 | 변화 |
|------|---------|---------|------|
| 카테고리당 시간 | ~3분 | ~4분 | +33% |
| 배치 간 대기 | 5초 | 15-30초 | +300-500% |
| **전체 소요 시간** | **~1.5시간** | **~2-2.5시간** | **+33-67%** |

**Trade-off**:
- ✅ **장점**: 봇 탐지 회피, 안정적인 수집, 0개 제품 문제 해결
- ⚠️ **단점**: 수집 시간 증가 (하지만 여전히 2시간 제한 내)

---

## 테스트 방법

### 1. 단일 카테고리 테스트
```bash
cd /c/Users/RAN/Downloads/amore_agent_amazon/data-collector
python -c "
import asyncio
from scrapers.rank_scraper import RankScraper

async def test():
    async with RankScraper() as scraper:
        # Perfumes & Fragrances 테스트
        products = await scraper.scrape(
            'https://www.amazon.com/Best-Sellers-Beauty-Personal-Care-Perfumes-Fragrances/zgbs/beauty/11056591/',
            max_rank=100
        )
        print(f'수집된 제품: {len(products)}개')

asyncio.run(test())
"
```

### 2. 전체 파이프라인 테스트
```bash
cd /c/Users/RAN/Downloads/amore_agent_amazon/data-collector
python main.py --mode scrape-only
```

---

## 추가 개선 가능 사항 (향후)

1. **프록시 로테이션** (옵션)
   - 여러 IP 주소 사용
   - 비용 발생 가능

2. **브라우저 세션 재사용**
   - 쿠키 저장/로딩 활성화
   - 첫 방문 후 세션 유지

3. **캡차 감지 및 처리**
   - 캡차 발생 시 일시 중지
   - 수동 해결 후 재개

4. **요청 패턴 더 다양화**
   - 페이지 간 이동 순서 랜덤화
   - 일부 카테고리 건너뛰기

---

## 파일 변경 요약

### 수정된 파일
1. ✅ `config/settings.py` - 새로운 설정 추가
2. ✅ `scrapers/base_scraper.py` - 인간 행동 시뮬레이션, 재시도 로직 강화
3. ✅ `main.py` - 카테고리 간 랜덤 딜레이 적용

### 새로운 설정
```python
# settings.py
VIEWPORT_POOL = [...]       # 7가지 viewport
TIMEZONE_POOL = [...]       # 6가지 timezone
LOCALE_POOL = [...]         # 2가지 locale

SCRAPER_SETTINGS = {
    "delay_min": 5,                    # ↑ from 3
    "delay_max": 10,                   # ↑ from 5
    "max_retries": 5,                  # ↑ from 3
    "retry_delay": 15,                 # ↑ from 10
    "category_delay_min": 15,          # NEW
    "category_delay_max": 30,          # NEW
    "page_load_timeout": 90,           # ↑ from 60
    "element_wait_timeout": 45,        # NEW
}
```

### 새로운 메서드
```python
# base_scraper.py
async def simulate_human_scroll(smooth=True)
async def simulate_mouse_movement()
async def simulate_human_reading()
async def _simulate_human_behavior()
async def save_cookies(filepath)
async def load_cookies(filepath)
```

---

## 결론

✅ **모든 주요 봇 탐지 회피 기법 적용 완료**

개선된 스크래퍼는:
1. 매번 다른 브라우저 핑거프린트 사용
2. 실제 사용자처럼 페이지 탐색
3. 충분한 대기 시간으로 서버 부담 감소
4. 강력한 재시도 로직으로 일시적 오류 극복
5. 봇 탐지 에러 발생 시 특별 처리

**예상 결과**: Perfumes & Fragrances와 Foot, Hand & Nail Care를 포함한 모든 24개 카테고리에서 안정적으로 제품 수집 가능

---

## 다음 단계

1. ✅ 코드 개선 완료
2. ⏳ **테스트 실행**: 문제 카테고리 먼저 테스트
3. ⏳ **전체 파이프라인 실행**: 24개 카테고리 전체 수집
4. ⏳ **결과 확인**: 0개 제품 문제 해결 확인

**준비 완료!** 이제 테스트를 실행하여 개선 효과를 확인할 수 있습니다.
