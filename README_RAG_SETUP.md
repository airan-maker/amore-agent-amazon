# RAG 시스템 설치 가이드

## 📋 Phase 1: 환경 설정

### 1.1 API 키 발급

다음 서비스들의 API 키를 발급받으세요:

#### Voyage AI (Embedding)
1. https://voyageai.com 접속
2. 회원가입 및 로그인
3. Dashboard → API Keys에서 키 생성
4. 무료 티어: 1M tokens

#### Vercel Blob Storage
1. Vercel Dashboard → Storage → Create Database → Blob
2. .env.production에서 토큰 복사
3. `BLOB_READ_WRITE_TOKEN` 저장

#### Vercel KV (선택사항 - 캐싱용)
1. Vercel Dashboard → Storage → Create Database → KV
2. .env.production에서 URL과 토큰 복사

### 1.2 의존성 설치

```bash
# 루트 디렉토리
npm install

# 프론트엔드 (app 디렉토리)
cd app
npm install
```

### 1.3 환경변수 설정

`.env.local` 파일을 열고 다음 값들을 업데이트하세요:

```env
VITE_USE_RAG=false  # 처음엔 false로 시작

VOYAGE_API_KEY=pa-xxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxxxx

# Vercel KV (선택사항)
KV_REST_API_URL=https://xxxxxxxxxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxxxxxxxxx

ADMIN_TOKEN=your-secure-random-token-here
```

---

## 📦 Phase 2: 임베딩 생성 (다음 단계)

Phase 1이 완료되면 다음을 실행하세요:

```bash
# 임베딩 생성 스크립트 실행
npm run generate:embeddings

# Vercel Blob에 업로드
npm run upload:lancedb
```

**예상 소요 시간:** 10-20분
**예상 비용:** ~$0.03

---

## ⚠️ 중요 사항

1. **API 키 보안**
   - `.env.local`은 절대 git에 커밋하지 마세요
   - 이미 .gitignore에 추가되어 있습니다

2. **의존성**
   - Node.js >= 18.0.0 필요
   - NPM >= 9.0.0 필요

3. **비용**
   - Voyage AI: 무료 티어 1M tokens (충분함)
   - Vercel: 무료 티어로 시작 가능
   - Claude API: 기존 사용량과 동일

---

## 🔧 다음 단계

Phase 1이 완료되었습니다! 다음은:

- [ ] Phase 2: 임베딩 생성 스크립트 작성
- [ ] Phase 3: 백엔드 API 구현
- [ ] Phase 4: 프론트엔드 통합
- [ ] Phase 5: Vercel 배포

자세한 내용은 프로젝트 루트의 계획 파일을 참고하세요.
