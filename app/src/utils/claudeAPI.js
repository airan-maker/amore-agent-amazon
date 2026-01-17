/**
 * Claude API Integration
 * Handles custom question answering using Claude AI
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true // Enable browser usage
});

/**
 * Ask Claude a custom question with context about the data
 */
export async function askClaude(question, dataContext) {
  try {
    // Check if API key exists
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }

    const systemPrompt = `당신은 아마존 마켓플레이스 데이터 분석 전문가입니다.
다음 데이터를 기반으로 사용자의 질문에 답변해주세요:

## 데이터 개요
- 총 제품 수: 500개 (5개 카테고리 × 100개)
- 카테고리: Lip Care Products, Skin Care Products, Eye Makeup, Face Makeup, Makeup Sets
- LANEIGE 제품: 4개
- 분석 기간: 최신 데이터

## 답변 지침
1. 데이터 기반 사실만 제시하고, 추측은 명확히 표시
2. 구체적인 수치와 백분율 포함
3. 비즈니스 인사이트와 실행 가능한 액션 제시
4. 한국어로 전문적이고 명확하게 답변
5. 답변 구조: 요약 → 상세 분석 → 전략적 제언

## 사용 가능한 데이터
${JSON.stringify(dataContext, null, 2)}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: question
        }
      ]
    });

    return {
      success: true,
      answer: {
        type: 'custom_claude',
        summary: extractSummary(message.content[0].text),
        fullText: message.content[0].text,
        model: message.model,
        usage: message.usage
      }
    };
  } catch (error) {
    console.error('Claude API Error:', error);

    let errorMessage = 'Claude API 호출 중 오류가 발생했습니다.';

    if (error.status === 404) {
      errorMessage = `API 키에 모델 접근 권한이 없습니다.

다음을 확인해주세요:
1. API 키가 유효한지 확인: https://console.anthropic.com/settings/keys
2. 계정에 Claude API 사용 권한이 있는지 확인
3. 결제 정보가 등록되어 있는지 확인

현재 사용 중인 API 키: ${import.meta.env.VITE_ANTHROPIC_API_KEY?.substring(0, 20)}...`;
    } else if (error.status === 401) {
      errorMessage = 'API 키가 유효하지 않습니다. .env 파일의 VITE_ANTHROPIC_API_KEY를 확인해주세요.';
    } else if (error.status === 429) {
      errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Extract summary from Claude's response (first paragraph)
 */
function extractSummary(text) {
  const lines = text.split('\n').filter(line => line.trim());
  // Return first non-empty line or first 200 chars
  return lines[0]?.substring(0, 200) || text.substring(0, 200);
}

/**
 * Prepare data context for Claude
 */
export function prepareDataContext(insightEngine) {
  const allProducts = insightEngine.allProducts;
  const laneigeProducts = insightEngine.getLaneigeProducts();
  const categoryAnalysis = insightEngine.getCategoryAnalysis();

  // Sample data to avoid token limits
  const sampleProducts = allProducts.slice(0, 20).map(p => ({
    name: p.product_name,
    brand: p.brand || p.product_name.split(' ')[0],
    rating: p.rating,
    reviews: p.review_count,
    category: p.category
  }));

  const laneigeData = laneigeProducts.map(p => ({
    name: p.product_name,
    rating: p.rating,
    reviews: p.review_count,
    category: p.category
  }));

  return {
    totalProducts: allProducts.length,
    laneigeProducts: laneigeData,
    laneigeCount: laneigeProducts.length,
    categoryAnalysis,
    topProducts: sampleProducts,
    availableCategories: Object.keys(categoryAnalysis)
  };
}

/**
 * Analyze category ranking trends using Claude
 * @param {Object} params - Analysis parameters
 * @param {string} params.category - Category name
 * @param {Array} params.trendData - Ranking trend data
 * @param {Object} params.topMovers - Top gaining/losing products
 * @param {Array} params.laneigeProducts - LANEIGE products data
 * @param {string} params.dateRange - Date range being analyzed
 * @returns {Promise<string>} - AI-generated insights
 */
export const analyzeCategoryTrends = async ({ category, trendData, topMovers, laneigeProducts = [], dateRange }) => {
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return '⚠️ Claude API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.';
    }

    // Build LANEIGE products section
    let laneigeSection = '';
    if (laneigeProducts && laneigeProducts.length > 0) {
      laneigeSection = `\n## 📌 LANEIGE 제품 랭킹 변동 상세 분석:
${laneigeProducts.map((p, i) => `${i + 1}. ${p.product_name}
   - 시작 랭킹: ${p.startRank}위
   - 종료 랭킹: ${p.endRank}위
   - 변동: ${p.rankChange > 0 ? `↑${p.rankChange}위 상승` : p.rankChange < 0 ? `↓${Math.abs(p.rankChange)}위 하락` : '변동 없음'}
   - 평점: ${p.rating} (리뷰 ${p.review_count?.toLocaleString()}개)`).join('\n\n')}

**LANEIGE 제품 총 ${laneigeProducts.length}개 발견**`;
    } else {
      laneigeSection = `\n## 📌 LANEIGE 제품:
해당 카테고리에서 LANEIGE 제품이 발견되지 않았습니다.`;
    }

    const prompt = `당신은 Amazon US 마켓플레이스 트렌드를 전문으로 하는 전자상거래 시장 분석 전문가입니다.

다음은 ${dateRange} 기간 동안 Amazon US의 "${category}" 카테고리 랭킹 데이터입니다:

## 상승 제품 (랭킹 개선 Top 5):
${topMovers.gainers.map((p, i) => `${i + 1}. ${p.product_name} (${p.brand})
   - 랭킹 변화: ${p.startRank}위 → ${p.endRank}위 (↑${p.improvement} 상승)
   - 평점: ${p.rating} (리뷰 ${p.review_count?.toLocaleString()}개)`).join('\n')}

## 하락 제품 (랭킹 하락 Top 5):
${topMovers.losers.map((p, i) => `${i + 1}. ${p.product_name} (${p.brand})
   - 랭킹 변화: ${p.startRank}위 → ${p.endRank}위 (↓${p.decline} 하락)
   - 평점: ${p.rating} (리뷰 ${p.review_count?.toLocaleString()}개)`).join('\n')}
${laneigeSection}

## 시장 전체 요약:
- 추적된 총 제품 수: ${trendData.totalProducts}개
- 평균 랭킹 변동성: ${trendData.avgVolatility?.toFixed(1)}%
- 랭킹 상승 제품: ${trendData.improvingCount}개
- 랭킹 하락 제품: ${trendData.decliningCount}개
- 랭킹 유지 제품: ${trendData.stableCount}개

다음 내용을 포함하여 상세한 분석을 제공해주세요:

### 1. 시장 트렌드 분석
이 카테고리의 전반적인 트렌드는 무엇인가? 경쟁이 심화되고 있는가, 아니면 시장 통합이 일어나고 있는가?

### 2. 성공 요인 분석
상위 상승 제품들에서 어떤 패턴을 발견할 수 있는가? (브랜드 포지셔닝, 가격대, 제품 특성, 계절적 요인 등)

### 3. LANEIGE 제품 심층 분석 ⭐⭐⭐ (가장 중요)
${laneigeProducts.length > 0 ? `
**LANEIGE 제품의 랭킹 변동을 매우 상세히 분석해주세요:**
- 각 LANEIGE 제품의 성과를 개별적으로 평가
- 상승한 제품: 왜 상승했는가? 어떤 전략이 효과적이었는가?
- 하락한 제품: 왜 하락했는가? 경쟁사 대비 약점은 무엇인가?
- LANEIGE의 현재 시장 포지션 (강점/약점)
- 경쟁 브랜드와의 비교 (Top Movers와 비교)
- 리뷰 수와 평점 분석
` : `
이 카테고리에 LANEIGE 제품이 없는 이유를 분석하고, 진입 기회가 있는지 평가해주세요.
`}

### 4. LANEIGE를 위한 전략적 제언
**즉시 실행 가능한 구체적인 제안:**
- 단기 전략 (1-3개월)
- 중장기 전략 (6-12개월)
- 제품 포트폴리오 최적화 방안
- 마케팅 및 프로모션 전략
- 경쟁 대응 전략

구체적이고 실행 가능하며 데이터 기반의 답변을 제공하세요. 명확성을 위해 불릿 포인트를 적극 사용하세요.

**중요: 반드시 한국어로 답변해주세요. LANEIGE 제품 분석에 가장 많은 비중을 할애해주세요.**`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return `⚠️ Error generating insights: ${error.message}`;
  }
};

/**
 * Analyze individual product ranking changes
 * @param {Object} params - Analysis parameters
 * @param {string} params.productName - Product name
 * @param {string} params.brand - Brand name
 * @param {Array} params.rankingHistory - Historical ranking data
 * @param {Object} params.competitorContext - Competitor information
 * @returns {Promise<string>} - AI-generated insights
 */
export const analyzeProductTrends = async ({ productName, brand, rankingHistory, competitorContext }) => {
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return '⚠️ Claude API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.';
    }

    const startRank = rankingHistory[0]?.rank;
    const endRank = rankingHistory[rankingHistory.length - 1]?.rank;
    const rankChange = startRank - endRank;
    const changeDirection = rankChange > 0 ? '상승' : rankChange < 0 ? '하락' : '유지';

    const prompt = `당신은 Amazon 마켓플레이스 분석 전문가입니다. 다음 제품의 랭킹 성과를 분석해주세요:

## 제품 정보:
- 제품명: ${productName}
- 브랜드: ${brand}
- 카테고리: ${competitorContext.category}
- 분석 기간: ${rankingHistory[0]?.date} ~ ${rankingHistory[rankingHistory.length - 1]?.date}

## 랭킹 성과:
- 시작 랭킹: ${startRank}위
- 종료 랭킹: ${endRank}위
- 변화: ${rankChange > 0 ? '+' : ''}${rankChange} (${changeDirection})
- 현재 평점: ${competitorContext.currentRating}
- 리뷰 수: ${competitorContext.reviewCount?.toLocaleString()}개

## 일별 랭킹 추이:
${rankingHistory.slice(0, 10).map(r => `${r.date}: ${r.rank}위`).join('\n')}
${rankingHistory.length > 10 ? '... (첫 10일만 표시)' : ''}

## 경쟁 환경:
- 카테고리 평균 랭킹: ${competitorContext.categoryAvgRank?.toFixed(1)}위
- ${brand} Top 100 내 제품 수: ${competitorContext.brandProductsInTop100}개
- 주요 경쟁사: ${competitorContext.topCompetitors?.join(', ')}

다음 내용을 포함하여 간결한 분석을 제공해주세요 (2-3 문단, 최대 400자):

1. **성과 평가**: 이 제품은 어떻게 수행하고 있는가? 랭킹 변화의 주요 원인은 무엇인가?

2. **경쟁력 분석**: 경쟁사 및 카테고리 평균과 비교했을 때 어떠한가?

3. **실행 가능한 제안**: 이 제품의 랭킹을 개선하기 위한 구체적인 조치는 무엇인가?

구체적이고 실행 가능한 답변을 제공하세요.

**중요: 반드시 한국어로 답변해주세요.**`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return `⚠️ Error generating insights: ${error.message}`;
  }
};
