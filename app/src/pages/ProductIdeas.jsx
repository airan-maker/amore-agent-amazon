import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GlassCard, GlassSectionTitle } from '../components/GlassCard';
import {
  Lightbulb,
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Beaker,
  Tag,
  Users,
  Shield,
  BarChart3,
  Zap
} from 'lucide-react';

export const ProductIdeas = () => {
  const [ideationData, setIdeationData] = useState(null);
  const [attributeData, setAttributeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    // Load ideation report
    import('../data/product_ideation_report.json')
      .then(data => {
        console.log('Loaded ideation data:', data);
        setIdeationData(data.default || data);
      })
      .catch(err => {
        console.error('Failed to load ideation data:', err);
      });

    // Load attributes
    import('../data/product_attributes.json')
      .then(data => {
        console.log('Loaded attributes data:', data);
        setAttributeData(data.default || data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load attributes data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 text-xl">Loading product insights...</div>
      </div>
    );
  }

  const metadata = ideationData?.metadata || {};
  const categoryAnalyses = ideationData?.category_analyses || {};
  const crossInsights = ideationData?.cross_category_insights || {};
  const categories = Object.keys(categoryAnalyses);
  const hasIdeas = metadata.total_ideas_generated > 0;

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-[1600px] mx-auto"
      >
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-6xl font-extralight tracking-[0.2em] text-white/95 mb-6 text-gradient">
            LANEIGE INTELLIGENCE
          </h1>
          <p className="text-lg font-light text-white/60 tracking-wider max-w-3xl mx-auto leading-relaxed">
            미국 Amazon Market의 흐름과 소비자의 목소리를 통합적으로 분석함으로써<br/>
            LANEIGE의 미국 시장에서의 성장을 지원합니다
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-3xl font-light text-white">
                  {metadata.total_ideas_generated || 0}
                </div>
                <div className="text-sm text-white/50">Product Ideas</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-light text-white">
                  {metadata.total_categories_analyzed || categories.length}
                </div>
                <div className="text-sm text-white/50">Categories</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/30 to-green-600/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-light text-white">
                  {attributeData?.metadata?.total_products || 0}
                </div>
                <div className="text-sm text-white/50">Products Analyzed</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-orange-600/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-3xl font-light text-white">
                  {metadata.ideas_per_category || 5}
                </div>
                <div className="text-sm text-white/50">Ideas/Category</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* No Ideas State */}
        {!hasIdeas && (
          <GlassCard className="p-12 mb-8">
            <div className="text-center max-w-lg mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-yellow-400/60" />
              </div>
              <h3 className="text-2xl font-light text-white mb-4">
                아이디어 데이터가 아직 생성되지 않았습니다
              </h3>
              <p className="text-white/60 mb-6 leading-relaxed">
                AI 기반 제품 아이디어를 생성하려면 데이터 수집 파이프라인을 실행하세요.
                <br />
                <code className="text-purple-300 bg-white/5 px-2 py-1 rounded text-sm">
                  ANTHROPIC_API_KEY
                </code> 환경 변수가 설정되어 있어야 합니다.
              </p>
              <div className="bg-white/5 rounded-lg p-4 text-left text-sm">
                <div className="text-white/50 mb-2">실행 방법:</div>
                <code className="text-green-300">
                  cd data-collector && python main.py --mode full
                </code>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Category Selection */}
        {categories.length > 0 && (
          <GlassCard className="p-6 mb-8">
            <GlassSectionTitle icon={Target}>
              카테고리별 분석 결과
            </GlassSectionTitle>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
              {categories.map(category => {
                const analysis = categoryAnalyses[category];
                const ideasCount = analysis?.product_ideas?.length || 0;
                const hasGapData = analysis?.gap_analysis?.total_products > 0;

                return (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                    className={`p-4 rounded-xl transition-all text-left ${
                      selectedCategory === category
                        ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-2 border-purple-400/50'
                        : 'bg-white/5 border-2 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium text-white text-sm mb-2 truncate">
                      {category}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ideasCount > 0
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {ideasCount} ideas
                      </span>
                      {hasGapData && (
                        <span className="text-xs text-white/40">
                          Gap ✓
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Selected Category Details */}
        {selectedCategory && categoryAnalyses[selectedCategory] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Gap Analysis Summary */}
            <GapAnalysisSummary
              category={selectedCategory}
              gapAnalysis={categoryAnalyses[selectedCategory].gap_analysis}
            />

            {/* Product Ideas */}
            {categoryAnalyses[selectedCategory].product_ideas?.length > 0 ? (
              <GlassCard className="p-6">
                <GlassSectionTitle icon={Lightbulb}>
                  {selectedCategory} - AI 생성 제품 아이디어
                </GlassSectionTitle>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                  {categoryAnalyses[selectedCategory].product_ideas.map((idea, idx) => (
                    <IdeaCard key={idx} idea={idea} index={idx} />
                  ))}
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-8">
                <div className="text-center text-white/50">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>이 카테고리에 대한 제품 아이디어가 아직 생성되지 않았습니다.</p>
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* Cross-Category Insights */}
        {crossInsights && Object.keys(crossInsights).length > 0 && (
          <GlassCard className="p-6 mt-8">
            <GlassSectionTitle icon={TrendingUp}>
              Cross-Category Insights
            </GlassSectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Top Opportunities */}
              {crossInsights.top_cross_category_opportunities?.length > 0 && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-5 border border-green-400/20">
                  <h4 className="text-sm font-medium text-green-300 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Top Opportunities
                  </h4>
                  <div className="space-y-3">
                    {crossInsights.top_cross_category_opportunities.slice(0, 5).map((opp, i) => (
                      <div key={i} className="text-sm">
                        <div className="text-white/80">
                          {opp.attribute_1} + {opp.attribute_2}
                        </div>
                        <div className="text-white/50 text-xs">
                          Score: {opp.opportunity_score}/10 • {opp.current_products} products
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Highest Scored Ideas */}
              {crossInsights.highest_scored_ideas?.length > 0 && (
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-5 border border-purple-400/20">
                  <h4 className="text-sm font-medium text-purple-300 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Top Rated Ideas
                  </h4>
                  <div className="space-y-3">
                    {crossInsights.highest_scored_ideas.slice(0, 5).map((idea, i) => (
                      <div key={i} className="text-sm">
                        <div className="text-white/80">{idea.product_name}</div>
                        <div className="text-white/50 text-xs">
                          {idea.category} • Score: {idea.score}/10
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Success Ingredients */}
              {crossInsights.common_success_ingredients?.length > 0 && (
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-5 border border-blue-400/20">
                  <h4 className="text-sm font-medium text-blue-300 mb-4 flex items-center gap-2">
                    <Beaker className="w-4 h-4" />
                    Common Success Ingredients
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {crossInsights.common_success_ingredients.slice(0, 10).map((ing, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-white/10 rounded-full text-xs text-white/80"
                      >
                        {ing.ingredient} ({ing.categories})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-xl p-5 border border-orange-400/20">
                <h4 className="text-sm font-medium text-orange-300 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analysis Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-light text-white">
                      {crossInsights.total_unique_opportunities || 0}
                    </div>
                    <div className="text-xs text-white/50">Unique Opportunities</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-white">
                      {crossInsights.avg_opportunity_score || 0}
                    </div>
                    <div className="text-xs text-white/50">Avg Opportunity Score</div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Model Info */}
        <div className="mt-8 text-center text-white/30 text-sm">
          Generated by {metadata.model_used || 'Claude AI'} •{' '}
          {metadata.generation_date ? new Date(metadata.generation_date).toLocaleDateString() : 'N/A'}
        </div>
      </motion.div>
    </div>
  );
};

// Gap Analysis Summary Component
const GapAnalysisSummary = ({ category, gapAnalysis }) => {
  if (!gapAnalysis || gapAnalysis.total_products === 0) {
    return (
      <GlassCard className="p-6">
        <div className="text-center text-white/50 py-4">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>{category} 카테고리에 대한 Gap 분석 데이터가 없습니다.</p>
        </div>
      </GlassCard>
    );
  }

  const successPatterns = gapAnalysis.success_patterns || {};

  return (
    <GlassCard className="p-6">
      <GlassSectionTitle icon={BarChart3}>
        {category} - Market Gap Analysis
      </GlassSectionTitle>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-white">{gapAnalysis.total_products}</div>
          <div className="text-xs text-white/50">Total Products</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-white">{gapAnalysis.products_with_attributes}</div>
          <div className="text-xs text-white/50">With Attributes</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-white">{gapAnalysis.total_combinations}</div>
          <div className="text-xs text-white/50">Combinations</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-light text-white">{gapAnalysis.opportunity_areas?.length || 0}</div>
          <div className="text-xs text-white/50">Opportunities</div>
        </div>
      </div>

      {/* Success Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {successPatterns.top_ingredients?.length > 0 && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
              <Beaker className="w-3 h-3" /> Top Ingredients
            </div>
            <div className="space-y-1">
              {successPatterns.top_ingredients.slice(0, 5).map((item, i) => (
                <div key={i} className="text-sm text-white/80 flex justify-between">
                  <span>{item.ingredient}</span>
                  <span className="text-white/40">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {successPatterns.top_benefits?.length > 0 && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Top Benefits
            </div>
            <div className="space-y-1">
              {successPatterns.top_benefits.slice(0, 5).map((item, i) => (
                <div key={i} className="text-sm text-white/80 flex justify-between">
                  <span>{item.benefit}</span>
                  <span className="text-white/40">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {successPatterns.top_price_tiers?.length > 0 && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Price Tiers
            </div>
            <div className="space-y-1">
              {successPatterns.top_price_tiers.slice(0, 5).map((item, i) => (
                <div key={i} className="text-sm text-white/80 flex justify-between">
                  <span className="capitalize">{item.tier}</span>
                  <span className="text-white/40">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

// Idea Card Component
const IdeaCard = ({ idea, index }) => {
  const [expanded, setExpanded] = useState(false);
  const attributes = idea.target_attributes || idea.attributes || {};

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-300 bg-green-500/20';
      case 'medium': return 'text-yellow-300 bg-yellow-500/20';
      case 'high': return 'text-red-300 bg-red-500/20';
      default: return 'text-white/50 bg-white/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="text-lg font-medium text-white mb-1">
              {idea.product_name || `Product Idea ${index + 1}`}
            </h4>
            {idea.tagline && (
              <p className="text-sm text-white/60 italic">{idea.tagline}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 bg-purple-500/20 px-3 py-1 rounded-full">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-200">
                {idea.market_opportunity_score || 'N/A'}/10
              </span>
            </div>
            {idea.risk_level && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskColor(idea.risk_level)}`}>
                {idea.risk_level} Risk
              </span>
            )}
          </div>
        </div>

        {/* Core Concept */}
        {idea.core_concept && (
          <p className="text-sm text-white/70 mb-4">{idea.core_concept}</p>
        )}

        {/* Quick Attributes */}
        <div className="flex flex-wrap gap-2 mb-3">
          {attributes.primary_benefit && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300">
              <Sparkles className="w-3 h-3" />
              {attributes.primary_benefit}
            </span>
          )}
          {attributes.formula_type && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded text-xs text-green-300">
              <Beaker className="w-3 h-3" />
              {attributes.formula_type}
            </span>
          )}
          {attributes.price_tier && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded text-xs text-orange-300">
              <Tag className="w-3 h-3" />
              {attributes.price_tier}
            </span>
          )}
        </div>

        {/* Key Ingredients */}
        {attributes.key_ingredients?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attributes.key_ingredients.map((ing, i) => (
              <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">
                {ing}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expand Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 bg-white/5 border-t border-white/10 flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white/80 hover:bg-white/10 transition-all"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Show Details
          </>
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-white/10"
        >
          <div className="p-5 space-y-4">
            {/* Rationale */}
            {idea.rationale && (
              <div className="bg-black/20 rounded-lg p-4">
                <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Why This Works
                </div>
                <p className="text-sm text-white/80">{idea.rationale}</p>
              </div>
            )}

            {/* Competitive Advantage */}
            {idea.competitive_advantage && (
              <div className="bg-black/20 rounded-lg p-4">
                <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Competitive Advantage
                </div>
                <p className="text-sm text-white/80">{idea.competitive_advantage}</p>
              </div>
            )}

            {/* Target Demographics */}
            {(attributes.target_skin_type?.length > 0 || attributes.certifications?.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {attributes.target_skin_type?.length > 0 && (
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Target Skin Types
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {attributes.target_skin_type.map((type, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {attributes.certifications?.length > 0 && (
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Certifications
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {attributes.certifications.map((cert, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProductIdeas;
