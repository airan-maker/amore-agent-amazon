/**
 * Product Analysis Utilities
 * Provides data analysis functions for market insights
 */

/**
 * Extract keywords from product names for USP clustering
 */
export const extractKeywords = (productName) => {
  if (!productName) return { formula: [], effects: [], values: [] };

  const name = productName.toLowerCase();
  const keywords = {
    formula: [],
    effects: [],
    values: []
  };

  // Formula keywords
  const formulaPatterns = {
    'loose': /\bloose\b/i,
    'pressed': /\bpressed\b/i,
    'liquid': /\bliquid\b/i,
    'powder': /\bpowder\b/i,
    'cream': /\bcream\b/i,
    'gel': /\bgel\b/i,
    'stick': /\bstick\b/i,
    'balm': /\bbalm\b/i,
    'serum': /\bserum\b/i,
    'oil': /\boil\b/i,
    'foam': /\bfoam\b/i,
    'mousse': /\bmousse\b/i
  };

  // Effect keywords
  const effectPatterns = {
    'blurring': /\bblurr(ing|ed)?\b/i,
    'mattifying': /\bmatt(ifying|e)?\b/i,
    'oil-control': /\boil[- ]control\b/i,
    'radiant': /\bradiant\b/i,
    'glow': /\bglow(ing)?\b/i,
    'brightening': /\bbrighten(ing)?\b/i,
    'smoothing': /\bsmooth(ing)?\b/i,
    'firming': /\bfirm(ing)?\b/i,
    'hydrating': /\bhydrat(ing|e)?\b/i,
    'moisturizing': /\bmoisturiz(ing|e)?\b/i,
    'anti-aging': /\banti[- ]aging\b/i,
    'wrinkle': /\bwrinkle\b/i,
    'pore-minimizing': /\bpore[- ]minimiz(ing|e)?\b/i,
    'long-wear': /\blong[- ]wear(ing)?\b/i,
    'waterproof': /\bwaterproof\b/i,
    'transfer-proof': /\btransfer[- ]proof\b/i,
    'smudge-proof': /\bsmudge[- ]proof\b/i
  };

  // Value/Ingredient keywords
  const valuePatterns = {
    'talc-free': /\btalc[- ]free\b/i,
    'vegan': /\bvegan\b/i,
    'cruelty-free': /\bcruelty[- ]free\b/i,
    'paraben-free': /\bparaben[- ]free\b/i,
    'sulfate-free': /\bsulfate[- ]free\b/i,
    'fragrance-free': /\bfragrance[- ]free\b/i,
    'mineral': /\bmineral\b/i,
    'natural': /\bnatural\b/i,
    'organic': /\borganic\b/i,
    'clean': /\bclean\b/i,
    'hypoallergenic': /\bhypoallergenic\b/i,
    'dermatologist-tested': /\bdermatologist[- ]tested\b/i,
    'sensitive-skin': /\bsensitive[- ]skin\b/i,
    'non-comedogenic': /\bnon[- ]comedogenic\b/i,
    'SPF': /\bspf\s*\d+\b/i
  };

  // Extract formula keywords
  Object.entries(formulaPatterns).forEach(([keyword, pattern]) => {
    if (pattern.test(name)) {
      keywords.formula.push(keyword);
    }
  });

  // Extract effect keywords
  Object.entries(effectPatterns).forEach(([keyword, pattern]) => {
    if (pattern.test(name)) {
      keywords.effects.push(keyword);
    }
  });

  // Extract value keywords
  Object.entries(valuePatterns).forEach(([keyword, pattern]) => {
    if (pattern.test(name)) {
      keywords.values.push(keyword);
    }
  });

  return keywords;
};

/**
 * Analyze keyword frequency across products
 */
export const analyzeKeywordFrequency = (products) => {
  const frequency = {
    formula: {},
    effects: {},
    values: {}
  };

  products.forEach(product => {
    const keywords = extractKeywords(product.product_name);

    keywords.formula.forEach(kw => {
      frequency.formula[kw] = (frequency.formula[kw] || 0) + 1;
    });

    keywords.effects.forEach(kw => {
      frequency.effects[kw] = (frequency.effects[kw] || 0) + 1;
    });

    keywords.values.forEach(kw => {
      frequency.values[kw] = (frequency.values[kw] || 0) + 1;
    });
  });

  return frequency;
};

/**
 * Calculate brand market concentration
 */
export const calculateBrandConcentration = (products) => {
  const brandCounts = {};

  products.forEach(product => {
    const brand = product.brand || 'Unknown';
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
  });

  const sortedBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1]);

  const top10 = sortedBrands.slice(0, 10);
  const top10Count = top10.reduce((sum, [, count]) => sum + count, 0);
  const otherCount = products.length - top10Count;

  return {
    top10Brands: top10.map(([brand, count]) => ({
      brand,
      count,
      percentage: ((count / products.length) * 100).toFixed(1)
    })),
    otherCount,
    otherPercentage: ((otherCount / products.length) * 100).toFixed(1),
    totalProducts: products.length,
    concentration: ((top10Count / products.length) * 100).toFixed(1)
  };
};

/**
 * Identify rising star products
 * Criteria: Low review count but high rating and high rank
 */
export const identifyRisingStars = (products, reviewThreshold = 5000) => {
  return products
    .map((product, index) => ({
      ...product,
      rank: index + 1
    }))
    .filter(product =>
      product.review_count < reviewThreshold &&
      product.rating >= 4.5 &&
      product.rank <= 50
    )
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10)
    .map(product => ({
      ...product,
      keywords: extractKeywords(product.product_name)
    }));
};

/**
 * Calculate strategic gaps - underserved keyword opportunities
 */
export const calculateStrategicGaps = (products) => {
  const frequency = analyzeKeywordFrequency(products);
  const totalProducts = products.length;

  const gaps = [];

  // Define important keywords that should be common
  const importantKeywords = {
    values: ['sensitive-skin', 'hypoallergenic', 'fragrance-free', 'talc-free', 'vegan'],
    effects: ['oil-control', 'pore-minimizing', 'long-wear', 'waterproof', 'blurring']
  };

  // Check value keywords
  importantKeywords.values.forEach(keyword => {
    const count = frequency.values[keyword] || 0;
    const percentage = (count / totalProducts) * 100;

    if (percentage < 10) { // Less than 10% market coverage
      gaps.push({
        keyword,
        type: 'value',
        count,
        percentage: percentage.toFixed(1),
        opportunity: 'high'
      });
    }
  });

  // Check effect keywords
  importantKeywords.effects.forEach(keyword => {
    const count = frequency.effects[keyword] || 0;
    const percentage = (count / totalProducts) * 100;

    if (percentage < 15) { // Less than 15% market coverage
      gaps.push({
        keyword,
        type: 'effect',
        count,
        percentage: percentage.toFixed(1),
        opportunity: percentage < 5 ? 'very high' : 'high'
      });
    }
  });

  return gaps.sort((a, b) => a.percentage - b.percentage);
};

/**
 * Analyze LANEIGE positioning vs market
 */
export const analyzeLaneigePositioning = (products, productDetails) => {
  const laneigeProducts = products.filter(p =>
    p.brand.toLowerCase().includes('laneige')
  );

  if (laneigeProducts.length === 0) {
    return null;
  }

  // Category averages
  const avgRating = products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length;
  const avgReviews = products.reduce((sum, p) => sum + (p.review_count || 0), 0) / products.length;

  // Top performers (top 20%)
  const top20Count = Math.ceil(products.length * 0.2);
  const topProducts = products.slice(0, top20Count);
  const topAvgRating = topProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / topProducts.length;
  const topAvgReviews = topProducts.reduce((sum, p) => sum + (p.review_count || 0), 0) / topProducts.length;

  // LANEIGE averages
  const laneigeAvgRating = laneigeProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / laneigeProducts.length;
  const laneigeAvgReviews = laneigeProducts.reduce((sum, p) => sum + (p.review_count || 0), 0) / laneigeProducts.length;

  // Calculate gaps
  const ratingGap = laneigeAvgRating - avgRating;
  const reviewGap = ((laneigeAvgReviews - avgReviews) / avgReviews) * 100;
  const topRatingGap = laneigeAvgRating - topAvgRating;
  const topReviewGap = ((laneigeAvgReviews - topAvgReviews) / topAvgReviews) * 100;

  // Strategic insights
  const insights = [];

  if (ratingGap < -0.2) {
    insights.push({
      type: 'critical',
      message: `평점이 카테고리 평균보다 ${Math.abs(ratingGap).toFixed(2)}점 낮습니다. 제품 품질 또는 고객 경험 개선이 시급합니다.`
    });
  } else if (ratingGap < 0) {
    insights.push({
      type: 'warning',
      message: `평점이 카테고리 평균보다 ${Math.abs(ratingGap).toFixed(2)}점 낮습니다. 리뷰 분석을 통한 개선점 파악이 필요합니다.`
    });
  }

  if (reviewGap < -50) {
    insights.push({
      type: 'critical',
      message: `리뷰 수가 카테고리 평균의 ${(100 + reviewGap).toFixed(0)}% 수준입니다. 마케팅 강화 및 고객 참여 전략이 필요합니다.`
    });
  } else if (reviewGap < -20) {
    insights.push({
      type: 'warning',
      message: `리뷰 수가 카테고리 평균보다 ${Math.abs(reviewGap).toFixed(0)}% 적습니다. 고객 리뷰 유도 캠페인을 고려하세요.`
    });
  }

  if (topRatingGap < -0.3) {
    insights.push({
      type: 'opportunity',
      message: `상위 20% 제품 대비 평점이 ${Math.abs(topRatingGap).toFixed(2)}점 낮습니다. 프리미엄 시장 진입을 위한 제품 개선이 필요합니다.`
    });
  }

  return {
    laneigeProducts,
    metrics: {
      rating: laneigeAvgRating.toFixed(2),
      reviews: Math.round(laneigeAvgReviews),
      listingShare: ((laneigeProducts.length / products.length) * 100).toFixed(1)
    },
    comparison: {
      category: {
        avgRating: avgRating.toFixed(2),
        avgReviews: Math.round(avgReviews),
        ratingGap: ratingGap.toFixed(2),
        reviewGap: reviewGap.toFixed(0)
      },
      topPerformers: {
        avgRating: topAvgRating.toFixed(2),
        avgReviews: Math.round(topAvgReviews),
        ratingGap: topRatingGap.toFixed(2),
        reviewGap: topReviewGap.toFixed(0)
      }
    },
    insights
  };
};
