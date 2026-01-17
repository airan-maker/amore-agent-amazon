# Amazon Data Collector - MVP Version

Amazon에서 실제 데이터를 수집하여 AI Agent 07의 Demo Data 포맷으로 변환하는 시스템입니다.

## 🎯 MVP 범위

- **타겟 카테고리**: Face Moisturizers (1개)
- **타겟 제품**: 5개 (LANEIGE 3개 + 경쟁사 2개)
- **수집 데이터**: 순위, 리뷰, 카테고리 정보
- **분석 엔진**: Claude 3.5 Haiku API
- **예상 기간**: 2주

## 📁 프로젝트 구조

```
data-collector/
├── config/
│   ├── products.yaml          # 타겟 제품 ASIN 리스트
│   ├── categories.yaml        # 카테고리 설정
│   └── settings.py            # 전역 설정
├── scrapers/
│   ├── base_scraper.py        # 기본 스크래퍼 클래스
│   ├── product_scraper.py     # 제품 정보 수집
│   ├── rank_scraper.py        # 순위 추적
│   └── review_scraper.py      # 리뷰 수집
├── processors/
│   ├── volatility_calculator.py  # 변동성 계산
│   ├── traffic_estimator.py      # 트래픽 추정
│   └── review_analyzer.py        # Claude API 리뷰 분석
├── generators/
│   ├── m1_generator.py        # M1 JSON 생성
│   └── m2_generator.py        # M2 JSON 생성
├── database/
│   ├── models.py              # 데이터 모델
│   └── db.py                  # DB 연결
├── utils/
│   ├── rate_limiter.py        # API 속도 제한
│   └── validators.py          # 데이터 검증
├── tests/
│   └── test_scrapers.py
├── data/                      # 수집된 원본 데이터
├── logs/                      # 로그 파일
├── main.py                    # 메인 실행 스크립트
└── requirements.txt
```

## 🚀 설치 및 실행

### 1. 패키지 설치
```bash
cd data-collector
pip install -r requirements.txt
playwright install chromium
```

### 2. 환경 변수 설정
`.env` 파일 생성:
```
ANTHROPIC_API_KEY=your_claude_api_key_here
```

### 3. 타겟 제품 설정
`config/products.yaml` 에 ASIN 추가

### 4. 실행
```bash
# 전체 파이프라인 실행
python main.py --mode full

# 특정 단계만 실행
python main.py --mode scrape-only
python main.py --mode analyze-only
```

## 📊 출력 데이터

생성되는 JSON 파일:
- `output/m1_breadcrumb_traffic.json`
- `output/m1_volatility_index.json`
- `output/m1_emerging_brands.json`
- `output/m2_usage_context.json`
- `output/m2_intelligence_bridge.json`

→ 이 파일들을 `app/src/data/` 폴더로 복사하여 대시보드에 바로 사용 가능

## 🔧 기술 스택

- **스크래핑**: Playwright (헤드리스 브라우저)
- **데이터 처리**: Pandas, NumPy
- **NLP 분석**: Claude 3.5 Haiku API
- **데이터베이스**: SQLite (MVP용, 추후 PostgreSQL 전환 가능)
- **스케줄링**: APScheduler (추후 추가)

## ⚠️ 주의사항

1. **Amazon Terms of Service**: 이 도구는 개인 연구 목적으로만 사용
2. **속도 제한**: 최소 3초 간격으로 요청 (Amazon 서버 부하 최소화)
3. **프록시**: 대량 수집 시 프록시 사용 권장
4. **비용**: Claude API 사용량에 따라 월 $10-50 예상

## 📈 개발 로드맵

- [x] Phase 1: 프로젝트 구조 생성
- [ ] Phase 2: 기본 스크래퍼 구축 (3일)
- [ ] Phase 3: M1 데이터 파이프라인 (3일)
- [ ] Phase 4: M2 리뷰 분석 (4일)
- [ ] Phase 5: 통합 테스트 및 최적화 (4일)

## 🤝 기여

버그 리포트나 개선 제안은 이슈로 등록해주세요.

## 📝 라이선스

내부 사용 전용 (Not for redistribution)
