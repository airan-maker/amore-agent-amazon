/**
 * Q&A System - Processes questions and generates insights-based answers
 */

import { RAGClient } from './ragClient';

export class QASystem {
  constructor(insightEngine) {
    this.engine = insightEngine;
    this.predefinedQuestions = this.initializePredefinedQuestions();
    this.ragClient = new RAGClient();
    this.useRAG = import.meta.env.VITE_USE_RAG === 'true';
  }

  // Initialize predefined question templates
  initializePredefinedQuestions() {
    return [
      {
        id: 'laneige_competitors',
        question: 'LANEIGE의 주요 경쟁사는 누구인가요?',
        category: 'competition',
        handler: () => this.answerCompetitors('laneige')
      },
      {
        id: 'laneige_strengths',
        question: 'LANEIGE 제품의 강점은 무엇인가요?',
        category: 'analysis',
        handler: () => this.answerStrengths('laneige')
      },
      {
        id: 'laneige_weaknesses',
        question: 'LANEIGE 제품의 약점이나 개선점은 무엇인가요?',
        category: 'analysis',
        handler: () => this.answerWeaknesses('laneige')
      },
      {
        id: 'lip_care_leaders',
        question: 'Lip Care 카테고리의 시장 리더는 누구인가요?',
        category: 'market',
        handler: () => this.answerCategoryLeaders('Lip Care Products')
      },
      {
        id: 'skin_care_trends',
        question: 'Skin Care 카테고리의 주요 트렌드는 무엇인가요?',
        category: 'trends',
        handler: () => this.answerCategoryTrends('Skin Care Products')
      },
      {
        id: 'medicube_analysis',
        question: 'medicube 브랜드는 어떤 특징이 있나요?',
        category: 'analysis',
        handler: () => this.answerBrandAnalysis('medicube')
      },
      {
        id: 'rating_leaders',
        question: '가장 높은 평점을 받는 제품들은 무엇인가요?',
        category: 'rankings',
        handler: () => this.answerTopRatedProducts()
      },
      {
        id: 'popular_ingredients',
        question: '인기 있는 성분은 무엇인가요?',
        category: 'trends',
        handler: () => this.answerPopularIngredients()
      },
      {
        id: 'market_opportunity',
        question: 'LANEIGE가 공략할 수 있는 시장 기회는 무엇인가요?',
        category: 'strategy',
        handler: () => this.answerMarketOpportunity('laneige')
      }
    ];
  }

  // Get all predefined questions
  getPredefinedQuestions() {
    return this.predefinedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      category: q.category
    }));
  }

  // Get questions by category
  getQuestionsByCategory(category) {
    return this.predefinedQuestions
      .filter(q => q.category === category)
      .map(q => ({
        id: q.id,
        question: q.question,
        category: q.category
      }));
  }

  // Process a question
  async processQuestion(questionId) {
    const question = this.predefinedQuestions.find(q => q.id === questionId);
    if (!question) {
      return {
        success: false,
        error: 'Question not found'
      };
    }

    try {
      const answer = await question.handler();
      return {
        success: true,
        question: question.question,
        answer,
        category: question.category
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process a custom question using RAG or Claude API
  async processCustomQuestion(questionText, askClaudeFunc, prepareContextFunc) {
    // Try RAG first if enabled
    if (this.useRAG) {
      try {
        console.log('🔄 Using RAG system...');
        const ragResult = await this.ragClient.askQuestion(questionText);

        if (ragResult.success) {
          console.log('✅ RAG system returned answer');
          return {
            success: true,
            question: questionText,
            answer: ragResult.answer,
            category: 'custom'
          };
        }

        console.warn('⚠️  RAG system failed, falling back to direct Claude API');
      } catch (error) {
        console.error('RAG error:', error);
        console.log('🔄 Falling back to direct Claude API...');
      }
    }

    // Fallback: Use traditional method (all data in prompt)
    try {
      const dataContext = prepareContextFunc(this.engine);
      const result = await askClaudeFunc(questionText, dataContext);

      if (result.success) {
        return {
          success: true,
          question: questionText,
          answer: result.answer,
          category: 'custom'
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Custom question processing failed'
      };
    }
  }

  // Answer: Who are LANEIGE's competitors?
  answerCompetitors(brand) {
    const competitors = this.engine.getCompetitors(brand);
    const laneigeProducts = this.engine.getLaneigeProducts();
    const allBrands = this.engine.getCategoryVisibility();

    // Calculate competitive metrics
    const laneigeRating = this.engine.getRatingAnalysis(brand);
    const laneigeReviews = this.engine.getReviewAnalysis(brand);
    const top3Competitors = competitors.slice(0, 3);

    // Competitive positioning analysis
    const competitiveMetrics = top3Competitors.map(comp => {
      const rating = this.engine.getRatingAnalysis(comp.brand);
      const reviews = this.engine.getReviewAnalysis(comp.brand);
      return {
        brand: comp.brand,
        productCount: comp.productCount,
        avgRating: rating?.avg || 0,
        totalReviews: reviews?.total || 0,
        avgReviewsPerProduct: reviews ? Math.round(reviews.avg) : 0
      };
    });

    return {
      type: 'competitors',
      summary: `${brand.toUpperCase()}는 ${competitors.length}개의 경쟁 브랜드와 경쟁하며, 상위 3개 경쟁사가 핵심 위협 요소입니다.`,
      data: {
        topCompetitors: competitors.slice(0, 8),
        competitiveMetrics,
        laneigeProductCount: laneigeProducts.length,
        totalCompetitors: competitors.length,
        laneigePosition: {
          rating: laneigeRating?.avg,
          reviews: laneigeReviews?.total,
          productCount: laneigeProducts.length
        }
      },
      insights: [
        `📋 전체 경쟁 브랜드 (${competitors.length}개): ${competitors.map(c => c.brand).join(', ')}`,
        ``,
        `🥇 최강 경쟁자: ${competitors[0]?.brand} (${competitors[0]?.productCount}개 제품, 평균 ${competitiveMetrics[0]?.avgRating.toFixed(1)}점)`,
        `🥈 2위 위협: ${competitors[1]?.brand} (${competitors[1]?.productCount}개 제품, 평균 ${competitiveMetrics[1]?.avgRating.toFixed(1)}점)`,
        `🥉 3위 추격: ${competitors[2]?.brand} (${competitors[2]?.productCount}개 제품, 평균 ${competitiveMetrics[2]?.avgRating.toFixed(1)}점)`,
        ``,
        `📊 경쟁 강도: ${competitors[0]?.productCount > laneigeProducts.length ? '높음' : '중간'} - ${competitors[0]?.brand}의 제품 수가 LANEIGE(${laneigeProducts.length}개)보다 ${Math.abs(competitors[0]?.productCount - laneigeProducts.length)}개 ${competitors[0]?.productCount > laneigeProducts.length ? '많음' : '적음'}`,
        competitiveMetrics[0]?.avgRating > (laneigeRating?.avg || 0)
          ? `⚠️ 품질 격차: ${competitiveMetrics[0]?.brand}가 평균 ${(competitiveMetrics[0]?.avgRating - (laneigeRating?.avg || 0)).toFixed(2)}점 높은 평점 유지 (${competitiveMetrics[0]?.brand} ${competitiveMetrics[0]?.avgRating.toFixed(2)}점 vs LANEIGE ${(laneigeRating?.avg || 0).toFixed(2)}점)`
          : `✅ 품질 우위: LANEIGE(${(laneigeRating?.avg || 0).toFixed(2)}점)가 ${competitors[0]?.brand}(${competitiveMetrics[0]?.avgRating.toFixed(2)}점) 대비 ${((laneigeRating?.avg || 0) - competitiveMetrics[0]?.avgRating).toFixed(2)}점 높은 평점`,
        competitors.find(c => c.brand.toLowerCase().includes('medicube'))
          ? `🚀 신흥 강자: medicube의 빠른 성장세가 시장 판도를 변화시키고 있음`
          : null
      ].filter(Boolean),
      strategicActions: [
        {
          priority: 'high',
          action: '제품 라인업 확대 또는 집중',
          rationale: `${competitors[0]?.brand}의 ${competitors[0]?.productCount}개 대비 ${laneigeProducts.length}개 제품으로 ${competitors[0]?.productCount > laneigeProducts.length ? '제품 다양성에서 열세' : '선택과 집중 전략 유지'}`,
          recommendation: competitors[0]?.productCount > laneigeProducts.length
            ? '핵심 카테고리(Lip Care 등)에서 제품 라인 확장 검토'
            : '현재 제품 포트폴리오로 수익성 집중, 신제품은 신중히 출시'
        },
        {
          priority: laneigeRating?.avg < 4.5 ? 'critical' : 'medium',
          action: '제품 품질 및 고객 만족도 강화',
          rationale: `평균 평점 ${laneigeRating?.avg.toFixed(2)}점으로 ${laneigeRating?.avg >= 4.5 ? '우수한 수준' : '개선 여지 있음'}`,
          recommendation: laneigeRating?.avg < 4.5
            ? '고객 불만 사항 집중 개선 (배송, 품질, 효과성), 목표: 4.5점 이상'
            : '현재 품질 유지하며 5.0점 만점 제품 비중 확대'
        },
        {
          priority: 'high',
          action: '경쟁 브랜드 벤치마킹',
          rationale: `상위 3개 경쟁사(${top3Competitors.map(c => c.brand).join(', ')})의 성공 요인 분석 필요`,
          recommendation: '월 1회 경쟁사 신제품, 마케팅 전략, 고객 리뷰 분석 리포트 작성'
        }
      ]
    };
  }

  // Answer: Brand visibility
  answerBrandVisibility(brand) {
    const categoryVisibility = this.engine.getCategoryVisibility();
    const rating = this.engine.getRatingAnalysis(brand);
    const reviews = this.engine.getReviewAnalysis(brand);

    const brandVisibility = categoryVisibility.find(m =>
      m.brand.toLowerCase().includes(brand.toLowerCase())
    );

    return {
      type: 'brand_visibility',
      summary: `${brand.toUpperCase()}는 상위권 리스트에서 ${brandVisibility ? `${brandVisibility.listingShare}%` : '낮은'} 가시성을 보이고 있습니다.`,
      data: {
        visibility: brandVisibility,
        rating,
        reviews,
        ranking: categoryVisibility.findIndex(m =>
          m.brand.toLowerCase().includes(brand.toLowerCase())
        ) + 1
      },
      insights: [
        rating ? `평균 평점 ${rating.avg.toFixed(1)}점으로 ${rating.above45}개 제품이 4.5점 이상입니다.` : null,
        reviews ? `총 ${reviews.total.toLocaleString()}개의 리뷰를 확보하여 브랜드 인지도가 높습니다.` : null,
        brandVisibility ? `상위 100개 리스트 내에서 ${brandVisibility.listingShare}% 리스팅 비중을 차지하고 있습니다.` : null
      ].filter(Boolean)
    };
  }

  // Answer: Strengths
  answerStrengths(brand) {
    const sentiment = this.engine.getSentimentAnalysis(brand);
    const rating = this.engine.getRatingAnalysis(brand);
    const reviews = this.engine.getReviewAnalysis(brand);
    const features = this.engine.getKeyFeatures(brand);
    const categoryAvgRating = this.engine.getRatingAnalysis();

    // Calculate competitive advantage metrics
    const ratingPercentile = rating && categoryAvgRating
      ? ((rating.avg - categoryAvgRating.avg) / categoryAvgRating.avg * 100).toFixed(1)
      : 0;

    // Identify core strengths with quantification
    const coreStrengths = [];
    if (rating?.avg >= 4.5) {
      coreStrengths.push({
        area: '제품 품질',
        metric: `평균 ${rating.avg.toFixed(2)}점`,
        benchmark: `시장 평균 대비 ${ratingPercentile}% ${ratingPercentile > 0 ? '우수' : '부족'}`,
        impact: 'high'
      });
    }
    if (rating?.above45 / rating?.count >= 0.7) {
      coreStrengths.push({
        area: '일관된 품질',
        metric: `${Math.round(rating.above45 / rating.count * 100)}% 제품이 4.5점 이상`,
        benchmark: '업계 평균 60% 대비 우수',
        impact: 'high'
      });
    }
    if (reviews?.avg > 5000) {
      coreStrengths.push({
        area: '브랜드 인지도',
        metric: `제품당 평균 ${Math.round(reviews.avg).toLocaleString()}개 리뷰`,
        benchmark: '높은 시장 참여도',
        impact: 'medium'
      });
    }

    return {
      type: 'strengths',
      summary: `${brand.toUpperCase()}는 ${coreStrengths.length}개 핵심 강점을 보유하며, 특히 ${coreStrengths[0]?.area || '제품 품질'}에서 두각을 나타냅니다.`,
      data: {
        coreStrengths,
        positiveReviews: sentiment?.positives || [],
        avgRating: rating?.avg,
        ratingDistribution: {
          above45: rating?.above45,
          above40: rating?.above4,
          total: rating?.count
        },
        keyFeatures: features
      },
      insights: [
        `📊 핵심 강점 분석 (총 ${coreStrengths.length}개 영역):`,
        ...coreStrengths.map((s, i) => `   ${i + 1}. ${s.area}: ${s.metric} (${s.benchmark})`),
        ``,
        rating?.avg >= 4.5
          ? `🏆 탁월한 품질: 평균 ${rating.avg.toFixed(2)}점으로 ${rating.above45}개 중 ${rating.above45}개 제품이 4.5점 이상 (${Math.round(rating.above45 / rating.count * 100)}%)`
          : `📈 개선 중: 평균 ${rating.avg.toFixed(2)}점, 전체 ${rating.count}개 중 ${rating?.above4}개 제품이 4.0점 이상 (${Math.round(rating.above4 / rating.count * 100)}%)`,
        sentiment && sentiment.positives.length > 0
          ? `💬 고객 호평 TOP 5:\n   ${sentiment.positives.slice(0, 5).map((p, i) => `${i + 1}) ${p}`).join('\n   ')}`
          : '💬 긍정 리뷰 데이터 수집 중',
        reviews?.total > 10000
          ? `📈 압도적 인지도: 총 ${reviews.total.toLocaleString()}개 리뷰 (제품당 평균 ${Math.round(reviews.avg).toLocaleString()}개, 최다 ${reviews.max.toLocaleString()}개)`
          : `📈 성장 중: 총 ${reviews?.total.toLocaleString() || 0}개 리뷰 (제품당 평균 ${Math.round(reviews?.avg || 0).toLocaleString()}개)`,
        ``,
        `✅ ${sentiment?.productCount || 0}개 제품 리뷰 분석 완료 (긍정 ${sentiment?.positives.length || 0}개 테마 식별)`
      ].filter(Boolean),
      strategicActions: [
        {
          priority: 'high',
          action: '강점 극대화 마케팅',
          rationale: coreStrengths.length > 0
            ? `${coreStrengths.map(s => s.area).join(', ')} 부문의 우수성을 마케팅 메시지 중심에 배치`
            : '제품 차별화 포인트 발굴 필요',
          recommendation: sentiment?.positives.slice(0, 3).join(', ') || '고객 리뷰 기반 USP 개발'
        },
        {
          priority: rating?.avg < 4.7 ? 'high' : 'medium',
          action: '4.7점 이상 제품 비중 확대',
          rationale: `현재 평균 ${rating?.avg.toFixed(2)}점, 4.7점은 프리미엄 포지셔닝의 최소 기준`,
          recommendation: '신제품 출시 시 베타 테스트 강화, 기존 제품 리뉴얼 검토'
        },
        {
          priority: 'medium',
          action: '긍정 리뷰 활용 극대화',
          rationale: `${reviews?.total.toLocaleString()}개 리뷰 중 긍정 비중을 제품 상세 페이지, SNS에 적극 활용`,
          recommendation: '매월 베스트 리뷰 선정 → 공식 채널 노출 → 리뷰어 리워드 프로그램 운영'
        }
      ]
    };
  }

  // Answer: Weaknesses
  answerWeaknesses(brand) {
    const sentiment = this.engine.getSentimentAnalysis(brand);
    const rating = this.engine.getRatingAnalysis(brand);
    const reviews = this.engine.getReviewAnalysis(brand);
    const price = this.engine.getPriceAnalysis();
    const competitors = this.engine.getCompetitors(brand);
    const categoryAvgRating = this.engine.getRatingAnalysis();

    // Calculate gaps and opportunities
    const weaknessAreas = [];

    if (rating?.avg < 4.5) {
      weaknessAreas.push({
        area: '평점 개선 필요',
        currentState: `평균 ${rating.avg.toFixed(2)}점`,
        targetState: '4.5점 이상 (프리미엄 기준)',
        gap: `${(4.5 - rating.avg).toFixed(2)}점 향상 필요`,
        impact: 'critical'
      });
    }

    if (reviews?.avg < 5000) {
      weaknessAreas.push({
        area: '리뷰 수 부족',
        currentState: `제품당 평균 ${Math.round(reviews.avg).toLocaleString()}개`,
        targetState: '5,000개 이상 (신뢰도 확보)',
        gap: `약 ${Math.round(5000 - reviews.avg).toLocaleString()}개 추가 필요`,
        impact: 'high'
      });
    }

    if (competitors[0]?.productCount > (this.engine.getLaneigeProducts().length + 2)) {
      weaknessAreas.push({
        area: '제품 라인업 제한',
        currentState: `${this.engine.getLaneigeProducts().length}개 제품`,
        targetState: `경쟁사 ${competitors[0]?.brand} 수준 (${competitors[0]?.productCount}개)`,
        gap: `${competitors[0]?.productCount - this.engine.getLaneigeProducts().length}개 부족`,
        impact: 'medium'
      });
    }

    const negativeThemes = sentiment?.negatives || [];
    const priorityIssues = negativeThemes.slice(0, 3);

    return {
      type: 'weaknesses',
      summary: `${brand.toUpperCase()}는 ${weaknessAreas.length}개 주요 개선 영역과 ${priorityIssues.length}개 고객 불만 테마를 보유하고 있습니다.`,
      data: {
        weaknessAreas,
        negativeReviews: negativeThemes,
        priceRange: price,
        competitiveGap: {
          rating: categoryAvgRating ? (rating.avg - categoryAvgRating.avg).toFixed(2) : 0,
          reviews: reviews && categoryAvgRating ? Math.round(reviews.avg - (categoryAvgRating.avg || 0)) : 0
        }
      },
      insights: [
        weaknessAreas.length > 0
          ? `🎯 개선 필요 영역 (총 ${weaknessAreas.length}개):`
          : '✅ 주요 약점 없음, 지속적 품질 관리 필요',
        ...weaknessAreas.map((w, i) =>
          `   ${i + 1}. ${w.area}: ${w.currentState} → ${w.targetState} (${w.gap})`
        ),
        weaknessAreas.length > 0 ? `` : null,
        negativeThemes.length > 0
          ? `⚠️ 고객 불만 TOP ${Math.min(priorityIssues.length, 5)}:\n   ${priorityIssues.slice(0, 5).map((n, i) => `${i + 1}) ${n}`).join('\n   ')}`
          : '💚 부정 리뷰 거의 없음 - 우수한 고객 만족도 유지',
        ``,
        rating?.avg < categoryAvgRating?.avg
          ? `📉 시장 평균 대비: LANEIGE ${rating.avg.toFixed(2)}점 vs 시장 평균 ${categoryAvgRating.avg.toFixed(2)}점 (${Math.abs(rating.avg - categoryAvgRating.avg).toFixed(2)}점 낮음)`
          : `📈 시장 평균 대비: LANEIGE ${rating?.avg.toFixed(2)}점 vs 시장 평균 ${categoryAvgRating?.avg.toFixed(2)}점 (${(rating.avg - categoryAvgRating.avg).toFixed(2)}점 높음)`,
        reviews?.avg < 5000
          ? `📊 리뷰 활성화 필요: 현재 제품당 ${Math.round(reviews.avg).toLocaleString()}개 → 목표 5,000개 (경쟁력 확보 기준선)`
          : `📊 리뷰 우수: 제품당 평균 ${Math.round(reviews.avg).toLocaleString()}개로 시장 신뢰도 확보`,
        ``,
        `🔍 ${sentiment?.productCount || 0}개 제품 피드백 분석 완료 (부정 ${negativeThemes.length}개 테마 식별)`
      ].filter(Boolean),
      strategicActions: [
        {
          priority: weaknessAreas.some(w => w.impact === 'critical') ? 'critical' : weaknessAreas.some(w => w.impact === 'high') ? 'high' : 'medium',
          action: weaknessAreas.length > 0 ? '개선 프로젝트 착수' : '예방적 품질 관리',
          rationale: weaknessAreas.length > 0
            ? `${weaknessAreas.length}개 개선 영역 확인 (${weaknessAreas.filter(w => w.impact === 'critical').length > 0 ? '긴급 ' + weaknessAreas.filter(w => w.impact === 'critical').length + '개, ' : ''}${weaknessAreas.filter(w => w.impact === 'high').length > 0 ? '높음 ' + weaknessAreas.filter(w => w.impact === 'high').length + '개, ' : ''}${weaknessAreas.filter(w => w.impact === 'medium').length > 0 ? '중간 ' + weaknessAreas.filter(w => w.impact === 'medium').length + '개' : ''})`
            : '주요 약점 없음, 지속적 모니터링 필요',
          recommendation: weaknessAreas.length > 0
            ? weaknessAreas.length === 1
              ? `1) ${weaknessAreas[0]?.area} (${weaknessAreas[0]?.gap}) 해결`
              : `1) ${weaknessAreas[0]?.area} (${weaknessAreas[0]?.gap}), 2) ${weaknessAreas[1]?.area} (${weaknessAreas[1]?.gap}) 순으로 해결`
            : '분기별 고객 피드백 모니터링 체계 유지'
        },
        {
          priority: 'high',
          action: '고객 불만 테마별 대응',
          rationale: priorityIssues.length > 0
            ? `주요 불만: ${priorityIssues.join(', ')}`
            : '긍정 리뷰 유지 전략 강화',
          recommendation: priorityIssues.length > 0
            ? 'R&D 팀과 협업하여 각 불만 사항에 대한 제품 개선안 마련 (3개월 내)'
            : '고객 만족도 유지 프로그램 운영'
        },
        {
          priority: reviews?.avg < 3000 ? 'high' : 'medium',
          action: '리뷰 수 확대 캠페인',
          rationale: `현재 제품당 평균 ${Math.round(reviews?.avg || 0).toLocaleString()}개, 목표 5,000개`,
          recommendation: '구매 후 7일 자동 리뷰 요청 이메일 + 리뷰 작성 시 다음 구매 10% 할인'
        },
        {
          priority: 'medium',
          action: '경쟁사 벤치마킹',
          rationale: `${competitors[0]?.brand} 등 상위 경쟁사의 고객 만족 전략 분석`,
          recommendation: '경쟁사 제품 구매 → 패키징/품질/경험 비교 → 개선안 도출'
        }
      ]
    };
  }

  // Answer: Price comparison
  answerPriceComparison(brand) {
    const allPrices = this.engine.getPriceAnalysis();
    const laneigeProducts = this.engine.getLaneigeProducts();

    const laneigePrice = laneigeProducts
      .map(p => p.price)
      .filter(p => p && typeof p === 'string')
      .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
      .filter(p => !isNaN(p) && p > 0);

    const avgLaneigePrice = laneigePrice.length > 0
      ? laneigePrice.reduce((a, b) => a + b, 0) / laneigePrice.length
      : null;

    return {
      type: 'price_comparison',
      summary: `${brand.toUpperCase()} 제품의 평균 가격은 시장 평균과 비교하여 분석했습니다.`,
      data: {
        laneigeAvg: avgLaneigePrice,
        marketAvg: allPrices?.avg,
        marketRange: { min: allPrices?.min, max: allPrices?.max }
      },
      insights: [
        avgLaneigePrice && allPrices
          ? avgLaneigePrice > allPrices.avg
            ? `시장 평균($${allPrices.avg.toFixed(2)})보다 높은 프리미엄 가격대($${avgLaneigePrice.toFixed(2)})를 형성하고 있습니다.`
            : `시장 평균($${allPrices.avg.toFixed(2)})과 유사한 가격대($${avgLaneigePrice.toFixed(2)})를 유지하고 있습니다.`
          : null,
        '가격 전략이 브랜드 포지셔닝과 일치하는지 검토가 필요합니다.'
      ].filter(Boolean)
    };
  }

  // Answer: Category leaders
  answerCategoryLeaders(category) {
    const topProducts = this.engine.getTopProducts(category, 20);
    const categoryVisibility = this.engine.getCategoryVisibility(category);
    const categoryAnalysis = this.engine.getCategoryAnalysis();

    // Calculate market concentration
    const top3Brands = categoryVisibility.slice(0, 3);
    const top3Concentration = top3Brands.reduce((sum, b) => sum + parseFloat(b.listingShare), 0);
    const laneigeInTop10 = topProducts.slice(0, 10).filter(p =>
      p.product_name.toLowerCase().includes('laneige')
    ).length;

    // Identify leader characteristics
    const leader = topProducts[0];
    const leaderMetrics = {
      rating: parseFloat(leader?.rating),
      reviews: parseInt(leader?.review_count),
      brand: leader?.product_name.split(' ')[0]
    };

    // Calculate average metrics for top 10
    const top10AvgRating = topProducts.slice(0, 10).reduce((sum, p) => sum + parseFloat(p.rating || 0), 0) / 10;
    const top10AvgReviews = topProducts.slice(0, 10).reduce((sum, p) => sum + parseInt(p.review_count || 0), 0) / 10;

    return {
      type: 'category_leaders',
      summary: `${category}는 상위 3개 브랜드가 ${top3Concentration.toFixed(1)}% 리스팅 비중을 차지하는 ${top3Concentration > 50 ? '고집중' : '경쟁적'} 시장입니다.`,
      data: {
        topProducts: topProducts.slice(0, 10).map((p, idx) => ({
          rank: idx + 1,
          name: p.product_name,
          rating: p.rating,
          reviews: p.review_count,
          brand: p.product_name.split(' ')[0]
        })),
        topBrands: categoryVisibility.slice(0, 8),
        marketStructure: {
          concentration: top3Concentration,
          top3Brands: top3Brands.map(b => b.brand),
          competitiveness: top3Concentration > 60 ? 'oligopoly' : top3Concentration > 40 ? 'concentrated' : 'competitive'
        },
        leaderProfile: leaderMetrics,
        benchmarks: {
          top10AvgRating: top10AvgRating.toFixed(2),
          top10AvgReviews: Math.round(top10AvgReviews).toLocaleString()
        }
      },
      insights: [
        `🥇 절대 1위: ${leader?.product_name}`,
        `   - 평점: ${leaderMetrics.rating}점`,
        `   - 리뷰: ${leaderMetrics.reviews.toLocaleString()}개`,
        `   - 브랜드: ${leaderMetrics.brand}`,
        ``,
        `🏆 Top 3 리더 브랜드 (총 ${top3Concentration.toFixed(1)}% 리스팅 비중):`,
        ...top3Brands.map((b, i) => `   ${i + 1}위. ${b.brand}: ${b.count}개 제품, ${b.listingShare}% 점유`),
        ``,
        `📊 시장 구조: ${top3Concentration > 60 ? '과점 시장 (상위 3개가 60% 이상 지배)' : top3Concentration > 40 ? '집중 시장 (상위 3개가 40-60% 점유)' : '경쟁 시장 (분산된 점유율)'}`,
        `   - 상위 3개 브랜드 집중도: ${top3Concentration.toFixed(1)}%`,
        `   - 시장 경쟁 강도: ${top3Concentration > 60 ? '낮음 (진입 장벽 높음)' : top3Concentration > 40 ? '중간 (기회 존재)' : '높음 (활발한 경쟁)'}`,
        ``,
        laneigeInTop10 > 0
          ? `✅ LANEIGE 포지션: Top 10 내 ${laneigeInTop10}개 제품 보유 → 시장 리더 그룹`
          : `⚠️ LANEIGE 포지션: Top 10 진입 제품 없음 → 시장 추격자 그룹`,
        ``,
        `📈 Top 10 진입 기준선:`,
        `   - 평균 평점: ${top10AvgRating.toFixed(2)}점`,
        `   - 평균 리뷰 수: ${Math.round(top10AvgReviews).toLocaleString()}개`,
        `   - 최소 요구 사항: 4.5점 이상 + 3,000개 이상 리뷰 (추정)`
      ],
      strategicActions: [
        {
          priority: laneigeInTop10 === 0 ? 'critical' : 'high',
          action: 'Top 10 진입 전략',
          rationale: laneigeInTop10 > 0
            ? `현재 ${laneigeInTop10}개 제품 Top 10 진입, 추가 제품 확대 필요`
            : 'Top 10 내 제품 없음, 시장 지배력 약화',
          recommendation: laneigeInTop10 === 0
            ? `1) 기존 제품 리뉴얼로 ${top10AvgRating.toFixed(1)}점 이상 달성 2) 신제품 출시 시 베타 테스트 강화`
            : `추가 제품을 Top 10에 진입시켜 ${laneigeInTop10 + 1}개 이상 확보`
        },
        {
          priority: 'high',
          action: '1위 제품 벤치마킹',
          rationale: `${leaderMetrics.brand}의 ${leader?.product_name}이 ${leaderMetrics.rating}점, ${leaderMetrics.reviews.toLocaleString()}개 리뷰로 압도적 우위`,
          recommendation: '1위 제품 구매 → 패키징/성분/효능/가격 분석 → 차별화 전략 수립 (2주 내)'
        },
        {
          priority: top3Concentration > 60 ? 'medium' : 'high',
          action: '시장 집중도 대응 전략',
          rationale: top3Concentration > 60
            ? '과점 시장 - 상위 브랜드와의 차별화 필수'
            : '경쟁 시장 - 빠른 점유율 확대 기회',
          recommendation: top3Concentration > 60
            ? '니치 세그먼트 공략 (예: 비건, 민감성 피부 등) 또는 혁신 제품으로 시장 재편'
            : '적극적 마케팅으로 Top 3 진입 시도 (6개월 목표)'
        }
      ]
    };
  }

  // Answer: Category trends
  answerCategoryTrends(category) {
    const products = this.engine.getTopProducts(category, 50);
    const categoryVisibility = this.engine.getCategoryVisibility(category);

    // Analyze rating trends
    const avgRating = products.reduce((sum, p) => sum + parseFloat(p.rating || 0), 0) / products.length;
    const highRatedCount = products.filter(p => parseFloat(p.rating) >= 4.7).length;
    const lowRatedCount = products.filter(p => parseFloat(p.rating) < 4.0).length;

    // Analyze review volume distribution
    const reviews = products.map(p => parseInt(p.review_count || 0));
    reviews.sort((a, b) => b - a);
    const medianReviews = reviews[Math.floor(reviews.length / 2)];
    const top10AvgReviews = reviews.slice(0, 10).reduce((a, b) => a + b, 0) / 10;

    // Market structure analysis
    const koreanBrands = categoryVisibility.filter(b =>
      ['LANEIGE', 'medicube', 'COSRX', 'Innisfree', 'Etude', 'MISSHA', 'Sulwhasoo']
        .some(kb => b.brand.toLowerCase().includes(kb.toLowerCase()))
    );
    const kBeautyShare = koreanBrands.reduce((sum, b) => sum + parseFloat(b.listingShare), 0);

    // Identify growth indicators
    const highReviewProducts = products.filter(p => parseInt(p.review_count) > medianReviews * 2);
    const emergingProducts = products.filter(p =>
      parseFloat(p.rating) >= 4.6 &&
      parseInt(p.review_count) < medianReviews &&
      parseInt(p.review_count) > 500
    );

    return {
      type: 'category_trends',
      summary: `${category}는 ${avgRating.toFixed(2)}점 평균 평점에 중간 리뷰 수 ${medianReviews.toLocaleString()}개로, ${kBeautyShare.toFixed(1)}% K-beauty 점유율을 보이는 ${kBeautyShare > 30 ? '한류 주도' : '글로벌 경쟁'} 시장입니다.`,
      data: {
        productCount: products.length,
        qualityDistribution: {
          premium: highRatedCount,
          standard: products.length - highRatedCount - lowRatedCount,
          needImprovement: lowRatedCount
        },
        reviewMetrics: {
          median: medianReviews,
          top10Avg: Math.round(top10AvgReviews),
          highEngagement: highReviewProducts.length
        },
        marketDynamics: {
          kBeautyShare: kBeautyShare.toFixed(1),
          koreanBrandsCount: koreanBrands.length,
          emergingProductsCount: emergingProducts.length
        }
      },
      insights: [
        `🎯 품질 분포 분석 (전체 ${products.length}개 제품):`,
        `   - 프리미엄 (4.7점↑): ${highRatedCount}개 (${Math.round(highRatedCount / products.length * 100)}%)`,
        `   - 표준 (4.0-4.7점): ${products.length - highRatedCount - lowRatedCount}개 (${Math.round((products.length - highRatedCount - lowRatedCount) / products.length * 100)}%)`,
        `   - 개선 필요 (4.0점↓): ${lowRatedCount}개 (${Math.round(lowRatedCount / products.length * 100)}%)`,
        `   → 평균 품질: ${avgRating.toFixed(2)}점`,
        ``,
        `📊 고객 참여도 분석:`,
        `   - 중간값: ${medianReviews.toLocaleString()}개 리뷰`,
        `   - Top 10 평균: ${Math.round(top10AvgReviews).toLocaleString()}개 리뷰`,
        `   - 고참여 제품 (중간값 2배↑): ${highReviewProducts.length}개`,
        `   → 시장 활성도: ${highReviewProducts.length > 15 ? '매우 높음' : highReviewProducts.length > 10 ? '높음' : '보통'}`,
        ``,
        `🇰🇷 K-beauty 영향력 분석:`,
        `   - 리스팅 비중: ${kBeautyShare.toFixed(1)}%`,
        `   - 브랜드 수: ${koreanBrands.length}개`,
        `   - 주요 브랜드: ${koreanBrands.slice(0, 3).map(b => b.brand).join(', ')}`,
        `   → K-beauty 위상: ${kBeautyShare > 30 ? '시장 주도' : kBeautyShare > 20 ? '강력한 경쟁자' : '도전자'}`,
        ``,
        emergingProducts.length > 0
          ? `🚀 신흥 강자 (${emergingProducts.length}개): ${emergingProducts.slice(0, 3).map(p => p.product_name.substring(0, 30)).join(', ')}${emergingProducts.length > 3 ? ' 외' : ''}`
          : '📈 시장 성숙기 - 기존 리더들의 안정적 지배력',
        ``,
        highReviewProducts.length > 10
          ? `💰 블록버스터 제품: ${highReviewProducts.length}개가 중간값(${medianReviews.toLocaleString()}개) 대비 2배 이상 리뷰 확보`
          : `🎯 틈새 기회: 대형 제품(${highReviewProducts.length}개) 부재로 신규 진입 가능성 높음`
      ],
      strategicActions: [
        {
          priority: kBeautyShare < 20 ? 'high' : 'medium',
          action: 'K-beauty 포지셔닝 강화',
          rationale: `현재 ${kBeautyShare.toFixed(1)}% 점유율로 ${kBeautyShare > 30 ? '주도적' : '제한적'} 위치`,
          recommendation: kBeautyShare < 20
            ? 'K-beauty 혁신 스토리 강조 + 성분 차별화 + 인플루언서 협업 확대'
            : '현재 K-beauty 리더십 유지하며 글로벌 브랜드와 차별화 지속'
        },
        {
          priority: highRatedCount / products.length < 0.3 ? 'high' : 'medium',
          action: '프리미엄 시장 진입',
          rationale: `4.7점 이상 제품이 ${Math.round(highRatedCount / products.length * 100)}%로 ${highRatedCount / products.length < 0.3 ? '기회' : '경쟁 치열'}`,
          recommendation: highRatedCount / products.length < 0.3
            ? '프리미엄 라인 출시 기회 - 베타 테스트 + 한정판 전략 + 4.8점 이상 목표'
            : '기존 프리미엄 제품 강화 + 럭셔리 에디션 고려'
        },
        {
          priority: emergingProducts.length > 3 ? 'high' : 'medium',
          action: '신규 경쟁자 모니터링',
          rationale: `${emergingProducts.length}개 신흥 제품이 빠른 성장세`,
          recommendation: emergingProducts.length > 3
            ? '매주 신규 경쟁자 리뷰 분석 + 차별화 포인트 발굴 + 선제적 대응'
            : '월간 시장 트렌드 리포트로 충분'
        }
      ]
    };
  }

  // Answer: Brand analysis
  answerBrandAnalysis(brand) {
    const rating = this.engine.getRatingAnalysis(brand);
    const reviews = this.engine.getReviewAnalysis(brand);
    const sentiment = this.engine.getSentimentAnalysis(brand);
    const competitors = this.engine.getCompetitors(brand);
    const allProducts = this.engine.allProducts;

    // Get brand products
    const brandProducts = allProducts.filter(p =>
      p.product_name.toLowerCase().includes(brand.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(brand.toLowerCase()))
    );

    // Category distribution
    const categoryBreakdown = {};
    brandProducts.forEach(p => {
      const cat = p.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1]);

    // Price analysis
    const prices = brandProducts
      .map(p => p.price)
      .filter(p => p && typeof p === 'string')
      .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
      .filter(p => !isNaN(p) && p > 0);

    const avgPrice = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null;

    const priceRange = prices.length > 0
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null;

    // Market position
    const totalProducts = allProducts.length;
    const datasetShare = ((brandProducts.length / totalProducts) * 100).toFixed(1);

    // Competitive ranking
    const brandRank = competitors.findIndex(c => c.brand.toLowerCase() === brand.toLowerCase()) + 1;

    // Rating percentile
    const allRatings = allProducts
      .filter(p => p.rating)
      .map(p => parseFloat(p.rating))
      .sort((a, b) => a - b);

    const ratingPercentile = rating?.avg
      ? ((allRatings.filter(r => r < rating.avg).length / allRatings.length) * 100).toFixed(0)
      : null;

    // Top products
    const topProducts = brandProducts
      .sort((a, b) => {
        const ratingDiff = parseFloat(b.rating) - parseFloat(a.rating);
        if (Math.abs(ratingDiff) < 0.1) {
          return parseInt(b.review_count) - parseInt(a.review_count);
        }
        return ratingDiff;
      })
      .slice(0, 3);

    return {
      type: 'brand_analysis',
      summary: `${brand.toUpperCase()}는 ${brandProducts.length}개 제품으로 분석 대상 상위 ${totalProducts}개 제품 중 ${datasetShare}%를 차지하며, 평균 ${rating?.avg.toFixed(2)}점의 우수한 평가를 받고 있습니다.`,
      data: {
        rating,
        reviews,
        sentiment,
        productCount: brandProducts.length,
        datasetShare,
        categoryBreakdown,
        avgPrice,
        priceRange,
        brandRank,
        ratingPercentile
      },
      insights: [
        `📊 **${brand.toUpperCase()} 브랜드 개요**`,
        `   • 제품 수: ${brandProducts.length}개`,
        `   • 상위 제품 대비: ${datasetShare}% (분석 대상 ${totalProducts}개 중)`,
        brandRank > 0 ? `   • 경쟁력 순위: ${brandRank}위 (${competitors.length}개 브랜드 중)` : null,
        `   • 활동 카테고리: ${sortedCategories.length}개`,
        ``,
        `⭐ **품질 및 평판**`,
        rating ? `   • 평균 평점: ${rating.avg.toFixed(2)}점 (상위 ${100 - parseInt(ratingPercentile)}% 수준)` : null,
        reviews ? `   • 총 리뷰 수: ${reviews.total.toLocaleString()}개` : null,
        reviews ? `   • 제품당 평균: ${Math.round(reviews.avg).toLocaleString()}개 리뷰` : null,
        rating && rating.avg >= 4.5
          ? `   • 우수한 품질 평가로 시장 신뢰도 확보`
          : rating && rating.avg >= 4.0
          ? `   • 양호한 품질 수준, 추가 개선 여지 존재`
          : `   • 품질 개선 필요`,
        ``,
        `💰 **가격 포지셔닝**`,
        avgPrice ? `   • 평균 가격: $${avgPrice.toFixed(2)}` : null,
        priceRange ? `   • 가격 범위: $${priceRange.min.toFixed(2)} ~ $${priceRange.max.toFixed(2)}` : null,
        avgPrice && avgPrice > 30
          ? `   • 프리미엄 가격대로 고급 브랜드 이미지 구축`
          : avgPrice && avgPrice > 15
          ? `   • 중가 포지셔닝으로 가성비와 품질 균형`
          : `   • 합리적 가격대로 접근성 확보`,
        ``,
        `📦 **카테고리 분포**`,
        ...sortedCategories.slice(0, 5).map(([cat, count]) =>
          `   • ${cat}: ${count}개 제품 (${((count / brandProducts.length) * 100).toFixed(0)}%)`
        ),
        sortedCategories.length > 5 ? `   ... 외 ${sortedCategories.length - 5}개 카테고리` : null,
        sortedCategories[0] && sortedCategories[0][1] >= brandProducts.length * 0.5
          ? `   → ${sortedCategories[0][0]}에 강하게 집중된 브랜드 전략`
          : `   → 다양한 카테고리에 걸친 포트폴리오`,
        ``,
        `🏆 **TOP 3 인기 제품**`,
        ...topProducts.map((p, i) =>
          `   ${i + 1}. ${p.product_name.substring(0, 60)}${p.product_name.length > 60 ? '...' : ''}\n      ${p.rating}점 | ${parseInt(p.review_count).toLocaleString()}개 리뷰`
        ),
        ``,
        `💡 **고객 피드백 분석**`,
        sentiment?.positives && sentiment.positives.length > 0
          ? `   ✅ 강점 (${sentiment.positives.length}개): ${sentiment.positives.slice(0, 3).join(', ')}`
          : `   ✅ 긍정적 피드백 확인 필요`,
        sentiment?.negatives && sentiment.negatives.length > 0
          ? `   ⚠️  개선점 (${sentiment.negatives.length}개): ${sentiment.negatives.slice(0, 3).join(', ')}`
          : `   ⚠️  부정 피드백 거의 없음`,
        ``,
        `🎯 **시장 포지션 평가**`,
        brandRank === 1
          ? `   • ${brand.toUpperCase()}는 시장 리더로서 강력한 입지를 보유하고 있습니다.`
          : brandRank > 0 && brandRank <= 5
          ? `   • Top 5 경쟁자로서 시장에서 주요 플레이어 지위를 확보했습니다.`
          : brandRank > 0 && brandRank <= 10
          ? `   • Top 10 브랜드로서 성장 잠재력이 높은 포지션입니다.`
          : `   • 시장 인지도 제고와 차별화 전략이 필요합니다.`,
        rating && reviews && rating.avg >= 4.5 && reviews.avg > 1000
          ? `   • 높은 평점과 풍부한 리뷰로 강력한 경쟁력을 보유하고 있습니다.`
          : reviews && reviews.avg < 1000
          ? `   • 리뷰 수 확대를 통한 시장 신뢰도 강화가 필요합니다.`
          : null
      ].filter(Boolean),
      strategicActions: brand.toLowerCase() === 'laneige'
        ? [
            // LANEIGE 자체 분석 시: 직접적인 액션
            {
              priority: brandRank > 10 || datasetShare < 5 ? 'critical' : brandRank > 5 ? 'high' : 'medium',
              action: 'LANEIGE 상위 제품군 진입 확대',
              rationale: `현재 상위 제품 중 ${datasetShare}% ${brandRank > 0 ? `(${brandRank}위)` : ''} → 목표 10% 달성`,
              recommendation: sortedCategories[0]
                ? `강점 카테고리인 ${sortedCategories[0][0]}에서 제품 라인 확장 + 신규 카테고리 진출`
                : '핵심 카테고리 선정 후 집중 투자'
            },
            {
              priority: reviews && reviews.avg < 2000 ? 'high' : 'medium',
              action: 'LANEIGE 브랜드 인지도 및 신뢰도 강화',
              rationale: reviews
                ? `현재 제품당 평균 ${Math.round(reviews.avg).toLocaleString()}개 리뷰 → 목표 5,000개`
                : '리뷰 및 평가 확대 필요',
              recommendation: '아마존 Vine 프로그램 + SNS 인플루언서 협업 + 리뷰 인센티브 프로그램 운영'
            },
            {
              priority: sentiment?.negatives && sentiment.negatives.length > 3 ? 'high' : 'medium',
              action: 'LANEIGE 제품 품질 및 고객 경험 개선',
              rationale: sentiment?.negatives && sentiment.negatives.length > 0
                ? `${sentiment.negatives.length}개 고객 불만 사항 해결 필요`
                : '지속적인 품질 관리 및 고객 만족도 유지',
              recommendation: sentiment?.negatives && sentiment.negatives.length > 0
                ? `우선순위: ${sentiment.negatives.slice(0, 2).join(', ')} 개선`
                : '분기별 고객 피드백 모니터링 및 개선 사이클 운영'
            }
          ]
        : [
            // 경쟁사 분석 시: LANEIGE에 대한 시사점
            {
              priority: brandRank <= 5 && datasetShare >= 5 ? 'high' : 'medium',
              action: `${brand.toUpperCase()} 성공 요인 벤치마킹`,
              rationale: brandRank > 0
                ? `${brand.toUpperCase()}는 ${brandRank}위, ${datasetShare}% 비중으로 강력한 포지션 확보`
                : `${brand.toUpperCase()}의 시장 전략 분석 필요`,
              recommendation: sortedCategories[0]
                ? `LANEIGE가 약한 ${sortedCategories[0][0]} 카테고리에서 ${brand.toUpperCase()} 제품 라인업 및 가격 전략 벤치마킹`
                : `${brand.toUpperCase()} 제품의 핵심 차별화 포인트 분석 후 LANEIGE 제품에 적용`
            },
            {
              priority: rating && rating.avg >= 4.5 ? 'high' : 'medium',
              action: `고품질 전략 대응`,
              rationale: rating
                ? `${brand.toUpperCase()} 평균 ${rating.avg.toFixed(2)}점으로 ${rating.avg >= 4.5 ? '프리미엄 품질 확보' : '준수한 평가'}`
                : '품질 수준 파악 필요',
              recommendation: rating && rating.avg >= 4.5
                ? `LANEIGE 제품 품질을 ${brand.toUpperCase()} 수준(${rating.avg.toFixed(2)}점) 이상으로 끌어올리기 위한 R&D 투자 및 고객 피드백 반영 강화`
                : sentiment?.positives && sentiment.positives.length > 0
                ? `${brand.toUpperCase()} 긍정 요소(${sentiment.positives.slice(0, 2).join(', ')})를 LANEIGE 제품 개발에 반영`
                : `${brand.toUpperCase()} 제품 구매 후 실사용 테스트로 품질 차이점 분석`
            },
            {
              priority: reviews && reviews.avg > 2000 ? 'high' : 'medium',
              action: `리뷰 마케팅 전략 학습`,
              rationale: reviews
                ? `${brand.toUpperCase()}는 제품당 평균 ${Math.round(reviews.avg).toLocaleString()}개 리뷰로 ${reviews.avg > 2000 ? '강력한 사회적 증거 확보' : '적정 수준 유지'}`
                : '리뷰 축적 전략 분석 필요',
              recommendation: reviews && reviews.avg > 2000
                ? `${brand.toUpperCase()} 리뷰 축적 전략(얼리어답터 프로그램, 인플루언서 협업 등) 분석 후 LANEIGE에 적용`
                : `LANEIGE가 ${brand.toUpperCase()} 대비 리뷰 수에서 우위 확보 기회 → 적극적 리뷰 마케팅 캠페인 전개`
            }
          ]
    };
  }

  // Answer: Korean brands visibility
  answerKoreanBrands() {
    const categoryVisibility = this.engine.getCategoryVisibility();
    const koreanBrands = ['LANEIGE', 'medicube', 'COSRX', 'Innisfree', 'Etude'];
    const allProducts = this.engine.allProducts;

    const koreanVisibility = categoryVisibility.filter(m =>
      koreanBrands.some(kb => m.brand.toLowerCase().includes(kb.toLowerCase()))
    );

    const totalKoreanShare = koreanVisibility.reduce((sum, b) => sum + parseFloat(b.listingShare), 0);

    // Analyze Korean brand products by category
    const koreanProducts = allProducts.filter(p =>
      koreanBrands.some(kb =>
        p.product_name.toLowerCase().includes(kb.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(kb.toLowerCase()))
      )
    );

    // Group by category
    const categoryBreakdown = {};
    koreanProducts.forEach(p => {
      const cat = p.category || 'Other';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, products: [] };
      }
      categoryBreakdown[cat].count++;
      categoryBreakdown[cat].products.push({
        name: p.product_name,
        rating: p.rating,
        reviews: p.review_count
      });
    });

    // Sort categories by product count
    const sortedCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1].count - a[1].count);

    // Brand-specific analysis
    const brandAnalysis = koreanBrands.map(brand => {
      const brandProducts = koreanProducts.filter(p =>
        p.product_name.toLowerCase().includes(brand.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(brand.toLowerCase()))
      );

      if (brandProducts.length === 0) return null;

      const avgRating = brandProducts.reduce((sum, p) => sum + (parseFloat(p.rating) || 0), 0) / brandProducts.length;
      const totalReviews = brandProducts.reduce((sum, p) => sum + (parseInt(p.review_count) || 0), 0);

      return {
        brand,
        productCount: brandProducts.length,
        avgRating: avgRating.toFixed(2),
        totalReviews,
        categories: [...new Set(brandProducts.map(p => p.category))]
      };
    }).filter(Boolean).sort((a, b) => b.productCount - a.productCount);

    // Calculate market position
    const totalProducts = allProducts.length;
    const koreanProductCount = koreanProducts.length;
    const datasetShare = ((koreanProductCount / totalProducts) * 100).toFixed(1);

    return {
      type: 'korean_brands',
      summary: `한국 브랜드는 총 ${koreanProductCount}개 제품으로 분석 대상 상위 ${totalProducts}개 제품 중 ${datasetShare}%를 차지하며, ${sortedCategories.length}개 카테고리에서 활동하고 있습니다.`,
      data: {
        koreanBrands: koreanVisibility,
        totalVisibility: totalKoreanShare,
        productCount: koreanProductCount,
        datasetShare,
        categoryBreakdown,
        brandAnalysis
      },
      insights: [
        `📊 **전체 K-beauty 현황**`,
        `   • 총 제품 수: ${koreanProductCount}개 (분석 대상 ${totalProducts}개 중 ${datasetShare}%)`,
        `   • 활동 브랜드: ${brandAnalysis.length}개`,
        `   • 진출 카테고리: ${sortedCategories.length}개`,
        ``,
        `🏆 **브랜드별 상세 분석**`,
        ...brandAnalysis.map((b, i) =>
          `   ${i + 1}. **${b.brand}**: ${b.productCount}개 제품 | 평균 ${b.avgRating}점 | 총 ${b.totalReviews.toLocaleString()}개 리뷰\n      카테고리: ${b.categories.join(', ')}`
        ),
        ``,
        `📦 **카테고리별 분포**`,
        ...sortedCategories.slice(0, 5).map(([cat, data], i) =>
          `   ${i + 1}. ${cat}: ${data.count}개 제품`
        ),
        sortedCategories.length > 5 ? `   ... 외 ${sortedCategories.length - 5}개 카테고리` : null,
        ``,
        `🎯 **상위 제품 내 포지셔닝**`,
        datasetShare > 15
          ? `   • K-beauty는 상위 제품군에서 강력한 입지(${datasetShare}%)를 확보하고 있습니다.`
          : `   • K-beauty는 ${datasetShare}% 비중으로 성장 잠재력이 큰 포지션입니다.`,
        brandAnalysis[0]
          ? `   • ${brandAnalysis[0].brand}가 ${brandAnalysis[0].productCount}개 제품으로 K-beauty를 선도하고 있습니다.`
          : null,
        sortedCategories[0]
          ? `   • ${sortedCategories[0][0]} 카테고리에 가장 집중되어 있습니다 (${sortedCategories[0][1].count}개 제품).`
          : null
      ].filter(Boolean),
      strategicActions: [
        {
          priority: datasetShare < 10 ? 'high' : 'medium',
          action: 'K-beauty 상위 제품군 진입 확대',
          rationale: `현재 상위 제품 중 ${datasetShare}% 비중, 목표 15% 달성을 위한 전략 필요`,
          recommendation: sortedCategories[0]
            ? `강점 카테고리인 ${sortedCategories[0][0]}에서 제품 라인 확대 + 신규 카테고리 진출 병행`
            : '핵심 카테고리 선정 후 집중 공략'
        },
        {
          priority: 'high',
          action: '브랜드 인지도 제고',
          rationale: brandAnalysis[0]
            ? `${brandAnalysis[0].brand} 외 다른 K-beauty 브랜드 가시성 강화 필요`
            : 'K-beauty 통합 마케팅 캠페인 필요',
          recommendation: 'K-beauty 콜렉션 큐레이션 + 인플루언서 협업 + "Korean Beauty Innovation" 스토리텔링'
        },
        {
          priority: 'medium',
          action: '카테고리 다각화',
          rationale: `현재 ${sortedCategories.length}개 카테고리 진출, 추가 확장 기회 탐색`,
          recommendation: sortedCategories.length < 10
            ? '시너지 높은 인접 카테고리(Hair Care, Body Care 등) 진출 검토'
            : '기존 카테고리 내 점유율 강화에 집중'
        }
      ]
    };
  }

  // Answer: Top rated products
  answerTopRatedProducts() {
    const allProducts = this.engine.allProducts
      .filter(p => p.rating && p.review_count)
      .sort((a, b) => {
        const ratingDiff = parseFloat(b.rating) - parseFloat(a.rating);
        if (Math.abs(ratingDiff) < 0.1) {
          return parseInt(b.review_count) - parseInt(a.review_count);
        }
        return ratingDiff;
      });

    const top10 = allProducts.slice(0, 10);
    const laneigeProducts = top10.filter(p =>
      p.product_name.toLowerCase().includes('laneige')
    );

    // Analyze top products by category
    const categoryDistribution = {};
    top10.forEach(p => {
      const cat = p.category || 'Other';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    // Calculate average metrics for top 10
    const avgRating = top10.reduce((sum, p) => sum + parseFloat(p.rating), 0) / top10.length;
    const avgReviews = top10.reduce((sum, p) => sum + parseInt(p.review_count), 0) / top10.length;

    // Identify brands in top 10
    const topBrands = [...new Set(top10.map(p =>
      p.brand || p.product_name.split(' ')[0]
    ))];

    // Rating tiers analysis
    const rating5_0 = top10.filter(p => parseFloat(p.rating) === 5.0).length;
    const rating4_9 = top10.filter(p => parseFloat(p.rating) >= 4.9 && parseFloat(p.rating) < 5.0).length;
    const rating4_8 = top10.filter(p => parseFloat(p.rating) >= 4.8 && parseFloat(p.rating) < 4.9).length;

    return {
      type: 'top_rated',
      summary: `상위 10개 제품의 평균 평점은 ${avgRating.toFixed(2)}점이며, 평균 ${Math.round(avgReviews).toLocaleString()}개의 리뷰를 보유하고 있습니다.`,
      data: {
        products: top10.map(p => ({
          name: p.product_name,
          rating: p.rating,
          reviews: p.review_count,
          category: p.category
        })),
        avgRating,
        avgReviews,
        laneigeCount: laneigeProducts.length,
        categoryDistribution,
        topBrands
      },
      insights: [
        `🏆 **Top 10 고평점 제품 순위**`,
        ...top10.map((p, i) => {
          const isLaneige = p.product_name.toLowerCase().includes('laneige');
          return `   ${i + 1}. ${isLaneige ? '⭐' : ''} ${p.product_name.substring(0, 50)}${p.product_name.length > 50 ? '...' : ''}\n      ${p.rating}점 | ${parseInt(p.review_count).toLocaleString()}개 리뷰 | ${p.category}`;
        }),
        ``,
        `📊 **Top 10 분석**`,
        `   • 평균 평점: ${avgRating.toFixed(2)}점`,
        `   • 평균 리뷰 수: ${Math.round(avgReviews).toLocaleString()}개`,
        `   • LANEIGE 제품: ${laneigeProducts.length}개${laneigeProducts.length > 0 ? ' ⭐' : ''}`,
        `   • 진출 브랜드: ${topBrands.length}개`,
        ``,
        `⚡ **평점 분포**`,
        `   • 5.0점 만점: ${rating5_0}개 제품`,
        `   • 4.9~4.99점: ${rating4_9}개 제품`,
        `   • 4.8~4.89점: ${rating4_8}개 제품`,
        ``,
        `📦 **카테고리 분포**`,
        ...Object.entries(categoryDistribution)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, count]) => `   • ${cat}: ${count}개`),
        ``,
        `💡 **성공 요인 분석**`,
        laneigeProducts.length > 0
          ? `   • LANEIGE는 Top 10에 ${laneigeProducts.length}개 제품이 포함되어 우수한 경쟁력을 보입니다.`
          : `   • LANEIGE는 Top 10 진입을 위한 품질 및 마케팅 강화가 필요합니다.`,
        avgReviews > 10000
          ? `   • Top 10 제품들은 평균 ${Math.round(avgReviews).toLocaleString()}개의 리뷰로 강력한 사회적 증거를 확보하고 있습니다.`
          : `   • Top 10 진입을 위해서는 리뷰 축적이 중요한 요소입니다.`
      ].filter(Boolean),
      strategicActions: [
        {
          priority: laneigeProducts.length === 0 ? 'critical' : laneigeProducts.length < 3 ? 'high' : 'medium',
          action: 'Top 10 진입 또는 유지 전략',
          rationale: laneigeProducts.length > 0
            ? `현재 ${laneigeProducts.length}개 제품이 Top 10에 포함, 추가 진입 기회 모색`
            : 'Top 10 진입으로 시장 신뢰도 및 매출 급증 효과 기대',
          recommendation: laneigeProducts.length > 0
            ? '기존 Top 10 제품의 성공 요인을 다른 제품에 적용 + 품질 유지 관리'
            : `벤치마크 대상: ${top10[0]?.product_name} (${top10[0]?.rating}점) - 제품 개선 + 리뷰 마케팅 강화`
        },
        {
          priority: 'high',
          action: '리뷰 수 확대 전략',
          rationale: `Top 10 평균 ${Math.round(avgReviews).toLocaleString()}개 리뷰 - 이 수준 달성이 필수`,
          recommendation: '아마존 Vine 프로그램 활용 + 구매 후 자동 리뷰 요청 + 인센티브 제공 (다음 구매 10% 할인)'
        },
        {
          priority: 'medium',
          action: '카테고리별 Top 제품 육성',
          rationale: Object.keys(categoryDistribution).length > 1
            ? `${Object.keys(categoryDistribution).length}개 카테고리에서 기회 확인`
            : '특정 카테고리 집중 공략 필요',
          recommendation: '각 주력 카테고리에서 1개 이상 Top 10 제품 확보 목표 설정'
        }
      ]
    };
  }

  // Answer: Popular ingredients
  answerPopularIngredients() {
    const allProducts = this.engine.allProducts;

    // Common beauty ingredient categories
    const ingredientCategories = {
      moisturizing: ['hyaluronic', 'glycerin', 'ceramide', 'squalane', 'shea', 'butter'],
      antiAging: ['retinol', 'peptide', 'collagen', 'vitamin', 'niacinamide'],
      brightening: ['vitamin c', 'niacinamide', 'arbutin', 'kojic'],
      soothing: ['centella', 'aloe', 'chamomile', 'green tea', 'cica'],
      exfoliating: ['aha', 'bha', 'salicylic', 'glycolic', 'lactic']
    };

    // Count products mentioning each category
    const categoryCounts = {};
    const specificIngredients = {};

    allProducts.forEach(p => {
      const productText = (p.product_name + ' ' + (p.description || '')).toLowerCase();

      // Count by category
      Object.entries(ingredientCategories).forEach(([category, keywords]) => {
        if (keywords.some(kw => productText.includes(kw))) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });

      // Extract specific ingredients from product names
      if (p.details?.analysis?.key_features?.ingredients) {
        const ing = p.details.analysis.key_features.ingredients;
        if (typeof ing === 'string') {
          const words = ing.toLowerCase().split(/[,\s]+/);
          words.forEach(word => {
            if (word.length > 4) {
              specificIngredients[word] = (specificIngredients[word] || 0) + 1;
            }
          });
        }
      }
    });

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, percentage: ((count / allProducts.length) * 100).toFixed(1) }));

    const topIngredients = Object.entries(specificIngredients)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Analyze LANEIGE ingredients
    const laneigeProducts = this.engine.getLaneigeProducts();
    const laneigeIngredientFocus = {};

    laneigeProducts.forEach(p => {
      const productText = (p.product_name + ' ' + (p.description || '')).toLowerCase();
      Object.entries(ingredientCategories).forEach(([category, keywords]) => {
        if (keywords.some(kw => productText.includes(kw))) {
          laneigeIngredientFocus[category] = (laneigeIngredientFocus[category] || 0) + 1;
        }
      });
    });

    const categoryLabels = {
      moisturizing: '보습',
      antiAging: '안티에이징',
      brightening: '미백/브라이트닝',
      soothing: '진정/수분',
      exfoliating: '각질제거'
    };

    return {
      type: 'popular_ingredients',
      summary: `시장에서 가장 인기 있는 성분 카테고리는 ${categoryLabels[topCategories[0]?.name] || '보습'} 성분으로, ${topCategories[0]?.percentage}%의 제품이 이를 강조하고 있습니다.`,
      data: {
        categories: topCategories,
        ingredients: topIngredients,
        laneigeIngredientFocus
      },
      insights: [
        `🧪 **인기 성분 카테고리 TOP 5**`,
        ...topCategories.slice(0, 5).map((cat, i) =>
          `   ${i + 1}. **${categoryLabels[cat.name]}**: ${cat.count}개 제품 (${cat.percentage}%)\n      키워드: ${ingredientCategories[cat.name].join(', ')}`
        ),
        ``,
        `💧 **구체적 인기 성분**`,
        topIngredients.length > 0
          ? `   ${topIngredients.slice(0, 8).map((ing, i) => `${i + 1}. ${ing.name} (${ing.count}회)`).join(' | ')}`
          : '   성분 데이터 분석 필요',
        ``,
        `🎯 **LANEIGE 성분 전략**`,
        ...Object.entries(laneigeIngredientFocus)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat, count]) =>
            `   • ${categoryLabels[cat]}: ${count}개 제품 (LANEIGE 강점 영역)`
          ),
        ``,
        `📊 **시장 트렌드 분석**`,
        topCategories[0]?.percentage > 40
          ? `   • ${categoryLabels[topCategories[0].name]} 성분이 시장을 압도적으로 지배하고 있습니다 (${topCategories[0].percentage}%).`
          : `   • 다양한 성분 카테고리가 균형있게 분포되어 있습니다.`,
        topCategories[1] && topCategories[0]
          ? `   • ${categoryLabels[topCategories[0].name]}(${topCategories[0].percentage}%)과 ${categoryLabels[topCategories[1].name]}(${topCategories[1].percentage}%)이 주요 트렌드입니다.`
          : null,
        `   • 천연 성분과 과학적 성분의 조합이 소비자들에게 인기입니다.`,
        `   • 성분 투명성과 효능 증명이 구매 결정의 핵심 요소입니다.`
      ].filter(Boolean),
      strategicActions: [
        {
          priority: 'high',
          action: '트렌드 성분 포트폴리오 강화',
          rationale: topCategories[0]
            ? `시장 1위 트렌드인 ${categoryLabels[topCategories[0].name]} 성분 (${topCategories[0].percentage}%)을 적극 활용`
            : '주요 트렌드 성분 식별 및 제품 개발',
          recommendation: topCategories.slice(0, 2).map(c => categoryLabels[c.name]).join(' + ') + ' 조합 제품 라인 개발'
        },
        {
          priority: 'medium',
          action: '성분 스토리텔링 강화',
          rationale: '소비자들의 성분 인식 수준 상승 → 성분 중심 마케팅 효과적',
          recommendation: '각 제품의 핵심 성분과 효능을 명확하게 설명하는 콘텐츠 제작 (인포그래픽, 비디오)'
        },
        {
          priority: 'medium',
          action: 'Clean Beauty & K-Beauty 성분 차별화',
          rationale: Object.keys(laneigeIngredientFocus).length > 0
            ? `LANEIGE는 이미 ${Object.entries(laneigeIngredientFocus).sort((a,b)=>b[1]-a[1])[0][0]} 영역에서 강점 보유`
            : 'K-Beauty 고유의 성분 강조 필요',
          recommendation: '한국 전통 성분(인삼, 녹차, 쌀 등) + 첨단 기술 조합 스토리 강화'
        }
      ]
    };
  }

  // Answer: Market opportunity
  answerMarketOpportunity(brand) {
    const competitors = this.engine.getCompetitors(brand);
    const categoryAnalysis = this.engine.getCategoryAnalysis();
    const sentiment = this.engine.getSentimentAnalysis(brand);
    const allProducts = this.engine.allProducts;

    // Get brand products
    const brandProducts = allProducts.filter(p =>
      p.product_name.toLowerCase().includes(brand.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(brand.toLowerCase()))
    );

    // Identify underserved categories (high product count but low brand presence)
    const brandCategories = [...new Set(brandProducts.map(p => p.category))];
    const underservedCategories = Object.entries(categoryAnalysis)
      .filter(([cat, data]) =>
        data.productCount > 30 && !brandCategories.includes(cat)
      )
      .sort((a, b) => b[1].productCount - a[1].productCount)
      .slice(0, 5)
      .map(([cat, data]) => ({
        category: cat,
        productCount: data.productCount,
        avgRating: data.avgRating,
        opportunity: 'untapped'
      }));

    // Identify weak competitors (rank 6-15) as acquisition or competition targets
    const weakCompetitors = competitors.slice(5, 15).map(c => ({
      brand: c.brand,
      productCount: c.productCount,
      gap: 'low product count or weak positioning'
    }));

    // Price gap analysis
    const allPrices = allProducts
      .map(p => p.price)
      .filter(p => p && typeof p === 'string')
      .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
      .filter(p => !isNaN(p) && p > 0);

    const brandPrices = brandProducts
      .map(p => p.price)
      .filter(p => p && typeof p === 'string')
      .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
      .filter(p => !isNaN(p) && p > 0);

    const avgMarketPrice = allPrices.length > 0
      ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
      : null;

    const avgBrandPrice = brandPrices.length > 0
      ? brandPrices.reduce((a, b) => a + b, 0) / brandPrices.length
      : null;

    // Price tier opportunities
    const priceGaps = [];
    if (avgBrandPrice && avgMarketPrice) {
      if (avgBrandPrice > avgMarketPrice * 1.2) {
        priceGaps.push({
          tier: 'mid-range',
          price: `$${(avgMarketPrice * 0.8).toFixed(0)}-$${avgMarketPrice.toFixed(0)}`,
          rationale: '현재 프리미엄 중심, 중가 제품으로 고객층 확대 가능'
        });
      } else if (avgBrandPrice < avgMarketPrice * 0.8) {
        priceGaps.push({
          tier: 'premium',
          price: `$${(avgMarketPrice * 1.2).toFixed(0)}-$${(avgMarketPrice * 1.5).toFixed(0)}`,
          rationale: '현재 합리적 가격대, 프리미엄 라인으로 수익성 개선'
        });
      }
    }

    // Review gap analysis - identify low-competition high-rating areas
    const highRatingLowReview = allProducts
      .filter(p =>
        parseFloat(p.rating) >= 4.7 &&
        parseInt(p.review_count) < 500 &&
        !p.product_name.toLowerCase().includes(brand.toLowerCase())
      )
      .slice(0, 10);

    const emergingOpportunities = highRatingLowReview.length > 5
      ? {
          count: highRatingLowReview.length,
          avgRating: (highRatingLowReview.reduce((s, p) => s + parseFloat(p.rating), 0) / highRatingLowReview.length).toFixed(2),
          categories: [...new Set(highRatingLowReview.map(p => p.category))],
          insight: '고평점이지만 리뷰가 적은 제품들 → 초기 시장, 진입 기회'
        }
      : null;

    // Customer pain points (from sentiment negatives)
    const customerGaps = sentiment?.negatives || [];

    // Calculate opportunity score
    const opportunityScore = (
      underservedCategories.length * 2 +
      priceGaps.length * 3 +
      customerGaps.length * 2 +
      (emergingOpportunities ? 3 : 0)
    );

    return {
      type: 'market_opportunity',
      summary: `${brand.toUpperCase()}가 공략할 수 있는 ${underservedCategories.length}개 미개척 카테고리와 ${priceGaps.length + customerGaps.length}개 시장 기회를 확인했습니다.`,
      data: {
        underservedCategories,
        weakCompetitors,
        priceGaps,
        customerGaps,
        emergingOpportunities,
        opportunityScore
      },
      insights: [
        `🎯 **미개척 카테고리 기회 (${underservedCategories.length}개)**`,
        underservedCategories.length > 0
          ? underservedCategories.map((cat, i) =>
              `   ${i + 1}. **${cat.category}**: ${cat.productCount}개 제품 시장 (평균 ${cat.avgRating?.toFixed(1) || 'N/A'}점)\n      → ${brand.toUpperCase()} 제품 없음, 신규 진입 기회`
            ).join('\n')
          : `   • 현재 주요 카테고리 대부분 진출 완료`,
        underservedCategories.length === 0
          ? `   • 기존 카테고리 내 점유율 강화에 집중 권장`
          : null,
        ``,
        `💰 **가격대별 기회**`,
        priceGaps.length > 0
          ? priceGaps.map((gap, i) =>
              `   ${i + 1}. **${gap.tier.toUpperCase()} 라인**: ${gap.price}\n      ${gap.rationale}`
            ).join('\n')
          : avgBrandPrice && avgMarketPrice
          ? `   • 현재 가격대(평균 $${avgBrandPrice.toFixed(2)})가 시장 평균($${avgMarketPrice.toFixed(2)})과 적정 수준\n   • 가격 경쟁력 유지하며 품질/가치 강조 전략 지속`
          : `   • 가격 데이터 분석 필요`,
        ``,
        `🔍 **고객 니즈 갭 분석**`,
        customerGaps.length > 0
          ? `   현재 미충족 고객 니즈 (${customerGaps.length}개):\n   ${customerGaps.slice(0, 5).map((gap, i) => `${i + 1}) ${gap}`).join('\n   ')}`
          : `   • 고객 불만 사항 최소화 상태\n   • 현재 제품 라인이 고객 니즈를 잘 충족하고 있음`,
        customerGaps.length > 5
          ? `   ... 외 ${customerGaps.length - 5}개 개선 기회`
          : null,
        ``,
        `🚀 **신흥 시장 기회**`,
        emergingOpportunities
          ? `   • 초기 단계 고품질 제품 ${emergingOpportunities.count}개 확인 (평균 ${emergingOpportunities.avgRating}점)\n   • 카테고리: ${emergingOpportunities.categories.slice(0, 3).join(', ')}\n   • ${emergingOpportunities.insight}`
          : `   • 대부분 카테고리가 성숙 단계\n   • 차별화 및 혁신 제품으로 기존 시장 재편 전략 필요`,
        ``,
        `⚔️  **경쟁 기회**`,
        weakCompetitors.length > 0
          ? `   약세 경쟁사 (${weakCompetitors.length}개):\n   ${weakCompetitors.slice(0, 5).map((c, i) => `${i + 1}. ${c.brand} (${c.productCount}개 제품)`).join('\n   ')}\n   → 상위 제품군 내 경쟁 우위 확보 또는 M&A 기회`
          : `   • 모든 경쟁사가 강력한 포지션 보유\n   • 차별화된 혁신 제품으로 틈새 공략 필요`,
        ``,
        `📊 **종합 기회 점수: ${opportunityScore}점**`,
        opportunityScore >= 10
          ? `   → 다수의 성장 기회 존재, 공격적 확장 전략 추천`
          : opportunityScore >= 5
          ? `   → 중간 수준의 기회, 선택적 투자 권장`
          : `   → 제한적 기회, 기존 시장 방어 및 품질 강화 집중`
      ].filter(Boolean),
      strategicActions: [
        {
          priority: underservedCategories.length > 3 ? 'high' : underservedCategories.length > 0 ? 'medium' : 'low',
          action: '미개척 카테고리 진출',
          rationale: underservedCategories.length > 0
            ? `${underservedCategories.length}개 높은 수요 카테고리에서 ${brand.toUpperCase()} 부재`
            : '주요 카테고리 진출 완료',
          recommendation: underservedCategories.length > 0
            ? `1순위: ${underservedCategories[0]?.category} (${underservedCategories[0]?.productCount}개 제품 시장) 진입을 위한 제품 개발 착수`
            : '현재 카테고리 내 제품 라인 확대 및 점유율 강화'
        },
        {
          priority: priceGaps.length > 0 ? 'high' : customerGaps.length > 3 ? 'high' : 'medium',
          action: '제품 포트폴리오 다각화',
          rationale: priceGaps.length > 0
            ? `${priceGaps[0]?.tier} 가격대 공백 존재`
            : customerGaps.length > 0
            ? `${customerGaps.length}개 고객 니즈 미충족`
            : '현재 포트폴리오 최적화 상태',
          recommendation: priceGaps.length > 0
            ? `${priceGaps[0]?.tier} 라인 신제품 개발 (${priceGaps[0]?.price}) - ${priceGaps[0]?.rationale}`
            : customerGaps.length > 0
            ? `고객 불만 TOP 3 (${customerGaps.slice(0, 3).join(', ')})을 해결하는 개선 제품 출시`
            : '시즌별 한정 에디션 또는 콜라보레이션 제품으로 신선함 유지'
        },
        {
          priority: emergingOpportunities ? 'high' : 'medium',
          action: '신흥 트렌드 선점',
          rationale: emergingOpportunities
            ? `${emergingOpportunities.categories.length}개 카테고리에서 초기 고품질 제품 발견 → 빠른 성장 예상`
            : '성숙 시장에서 혁신 제품으로 재편 기회',
          recommendation: emergingOpportunities
            ? `${emergingOpportunities.categories[0]} 등 신흥 카테고리에 빠르게 진입하여 초기 시장 리더십 확보 (6개월 내)`
            : 'AI, 맞춤형, 지속가능성 등 미래 트렌드 반영한 혁신 제품 라인 개발'
        },
        {
          priority: 'medium',
          action: '고객 락인 (Lock-in) 전략',
          rationale: '구독 모델과 번들 상품으로 고객 생애 가치(LTV) 증대',
          recommendation: '월간 구독 박스 (15% 할인) + 3종 세트 번들 (20% 할인) + 리필 자동 배송 시스템 구축'
        }
      ]
    };
  }
}

export default QASystem;
