# LANEIGE Amazon Market Intelligence

Amazon US 마켓플레이스 데이터 분석을 통한 LANEIGE 브랜드 전략 인사이트 플랫폼

## 주요 기능

### Market Analysis
- 카테고리별 제품 랭킹 및 트렌드 분석
- AI 기반 랭킹 인사이트 (Claude Sonnet 4)
- 시장 점유율 및 브랜드 포지셔닝 분석
- Excel 데이터 내보내기

### Brand Intelligence
- LANEIGE 제품 실시간 모니터링
- 카테고리별 변동성 지수
- 신흥 경쟁 브랜드 감지
- 리뷰 기반 사용 맥락 분석

### Q&A AI Agent
- Claude AI 기반 데이터 질의응답
- 맞춤형 시장 분석 리포트 생성

## 기술 스택

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts
- **AI**: Claude API (Anthropic)
- **Deployment**: Vercel

## 시작하기

### 설치

```bash
# 저장소 클론
git clone https://github.com/airan-maker/amore-agent-amazon.git
cd amore-agent-amazon

# 의존성 설치
cd app
npm install

# 개발 서버 실행
npm run dev
```

### 환경 변수

루트 디렉토리에 `.env.local` 파일 생성:

```env
# Claude API (필수)
ANTHROPIC_API_KEY=sk-ant-xxx...

# Voyage AI - 임베딩 (선택)
VOYAGE_API_KEY=pa-xxx...

# Vercel Blob Storage (선택)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx...
```

### Vercel 배포

1. Vercel Dashboard에서 프로젝트 import
2. **Root Directory**: `app`
3. **Environment Variables** 설정:
   - `ANTHROPIC_API_KEY`
   - `VOYAGE_API_KEY` (선택)
   - `BLOB_READ_WRITE_TOKEN` (선택)
4. Deploy

## 프로젝트 구조

```
amore-agent-amazon/
├── app/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   ├── pages/          # 페이지
│   │   ├── utils/          # 유틸리티
│   │   └── data/           # JSON 데이터
│   └── package.json
├── api/                    # Vercel Serverless Functions
│   ├── chat.js             # Claude API 엔드포인트
│   └── qa.js               # RAG Q&A 엔드포인트
├── data-collector/         # Python 데이터 수집기
└── demo/                   # 데모 데이터
```

## 라이선스

Private - AMORE PACIFIC
