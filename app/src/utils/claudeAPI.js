/**
 * Claude API Integration
 * Calls serverless function to protect API key
 */

// API base URL - uses relative path in production, localhost in development
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

/**
 * Call the secure chat API
 */
async function callChatAPI(action, payload) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Ask Claude a custom question with context about the data
 */
export async function askClaude(question, dataContext) {
  try {
    const result = await callChatAPI('askClaude', { question, dataContext });

    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }

    return result;
  } catch (error) {
    console.error('Claude API Error:', error);

    let errorMessage = 'Claude API 호출 중 오류가 발생했습니다.';

    if (error.message.includes('401')) {
      errorMessage = 'API 키가 유효하지 않습니다. 서버 환경 변수를 확인해주세요.';
    } else if (error.message.includes('429')) {
      errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
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
 */
export const analyzeCategoryTrends = async ({ category, trendData, topMovers, laneigeProducts = [], dateRange }) => {
  try {
    const result = await callChatAPI('analyzeCategoryTrends', {
      category,
      trendData,
      topMovers,
      laneigeProducts,
      dateRange
    });

    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }

    return result.answer;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return `⚠️ Error generating insights: ${error.message}`;
  }
};

/**
 * Analyze individual product ranking changes
 */
export const analyzeProductTrends = async ({ productName, brand, rankingHistory, competitorContext }) => {
  try {
    const result = await callChatAPI('analyzeProductTrends', {
      productName,
      brand,
      rankingHistory,
      competitorContext
    });

    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }

    return result.answer;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return `⚠️ Error generating insights: ${error.message}`;
  }
};
