import { motion } from 'framer-motion';
import { GlassCard, ScanningText } from './GlassCard';
import { Zap, TrendingUp, AlertTriangle, Users, Target, Lightbulb, DollarSign, CheckCircle, ArrowRight, Shield, Hash, MessageCircle, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';

export const IntelligenceBridge = ({ data }) => {
  const [selectedSection, setSelectedSection] = useState('insights'); // 'insights', 'pain-points', 'recommendations', 'trends', 'keywords'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedKeywordBrand, setSelectedKeywordBrand] = useState(null);

  if (!data) {
    return (
      <GlassCard delay={0.2} className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">
            Strategic Intelligence Bridge
          </h3>
        </div>
        <div className="text-center py-12">
          <p className="text-white/60 text-sm">
            전략적 인텔리전스 데이터를 수집 중입니다. 데이터 수집이 완료되면 업데이트됩니다.
          </p>
        </div>
      </GlassCard>
    );
  }

  const getPriorityColor = (priority) => {
    if (priority?.toLowerCase().includes('critical')) return 'text-rose-400 border-rose-400/40 bg-rose-500/10';
    if (priority?.toLowerCase().includes('high')) return 'text-amber-400 border-amber-400/40 bg-amber-500/10';
    if (priority?.toLowerCase().includes('medium')) return 'text-blue-400 border-blue-400/40 bg-blue-500/10';
    return 'text-emerald-400 border-emerald-400/40 bg-emerald-500/10';
  };

  const getSeverityColor = (severity) => {
    if (severity?.toLowerCase() === 'critical') return 'text-rose-400';
    if (severity?.toLowerCase() === 'high') return 'text-amber-400';
    if (severity?.toLowerCase() === 'medium') return 'text-blue-400';
    return 'text-emerald-400';
  };

  return (
    <div className="space-y-6">
      <GlassCard delay={0.2} className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">
              Strategic Intelligence Bridge
            </h3>
          </div>

          {/* Section Toggle */}
          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('insights')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'insights'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              Cross-Brand Insights
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('pain-points')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'pain-points'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              Pain Points
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('recommendations')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'recommendations'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              Recommendations
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('trends')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'trends'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              Emerging Trends
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('keywords')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'keywords'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              Keyword Analysis
            </motion.button>
          </div>
        </div>

        {/* Cross-Brand Insights Section */}
        {selectedSection === 'insights' && (
          <>
            {data.cross_brand_insights && Array.isArray(data.cross_brand_insights) && data.cross_brand_insights.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.cross_brand_insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                onClick={() => setSelectedItem(selectedItem === `insight-${idx}` ? null : `insight-${idx}`)}
                className={`
                  p-6 rounded-2xl border cursor-pointer
                  transition-all duration-300
                  ${selectedItem === `insight-${idx}`
                    ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-400/50 ring-2 ring-purple-400/30 scale-[1.02]'
                    : 'bg-white/5 border-white/10 hover:border-purple-400/30 hover:scale-[1.01]'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-light text-white/95 mb-3">{insight.theme}</h4>
                    <div className="flex flex-wrap gap-2">
                      {(insight.affected_brands || []).map((brand, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
                    <div className="text-xs text-blue-300 mb-2 uppercase tracking-wider">Insight</div>
                    <div className="text-sm text-white/80 font-light">{insight.insight}</div>
                  </div>

                  <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                    <div className="text-xs text-emerald-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      Opportunity
                    </div>
                    <div className="text-sm text-white/80 font-light">{insight.opportunity}</div>
                  </div>

                  {selectedItem === `insight-${idx}` && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-3 border-t border-white/20"
                    >
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Market Size</div>
                        <div className="text-sm text-white/80 font-light">{insight.market_size}</div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  크로스 브랜드 인사이트 데이터가 없습니다.
                </p>
              </div>
            )}
          </>
        )}

        {/* Consumer Pain Points Section */}
        {selectedSection === 'pain-points' && (
          <>
            {data.consumer_pain_points && Array.isArray(data.consumer_pain_points) && data.consumer_pain_points.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {data.consumer_pain_points.map((painPoint, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="p-6 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-xl font-light text-white/95">{painPoint.pain_point}</h4>
                      <span className={`text-xs px-3 py-1 rounded-full border uppercase tracking-wider ${getSeverityColor(painPoint.severity)}`}>
                        {painPoint.severity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-rose-500/10 rounded-lg border border-rose-400/20">
                    <div className="text-xs text-rose-300 mb-2 uppercase tracking-wider">Evidence</div>
                    <div className="text-sm text-white/80 font-light">{painPoint.evidence}</div>
                  </div>

                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
                    <div className="text-xs text-blue-300 mb-2 uppercase tracking-wider">Current Solution</div>
                    <div className="text-sm text-white/80 font-light">{painPoint.current_solution}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-400/20">
                    <div className="text-xs text-amber-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      Gap
                    </div>
                    <div className="text-sm text-white/80 font-light">{painPoint.gap}</div>
                  </div>

                  <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                    <div className="text-xs text-emerald-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <ArrowRight className="w-3 h-3" />
                      Recommended Action
                    </div>
                    <div className="text-sm text-white/80 font-light">{painPoint.recommended_action}</div>
                  </div>
                </div>
              </motion.div>
            ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  소비자 페인 포인트 데이터가 없습니다.
                </p>
              </div>
            )}
          </>
        )}

        {/* Strategic Recommendations Section */}
        {selectedSection === 'recommendations' && (
          <>
            {data.strategic_recommendations && Array.isArray(data.strategic_recommendations) && data.strategic_recommendations.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.strategic_recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                onClick={() => setSelectedItem(selectedItem === `rec-${idx}` ? null : `rec-${idx}`)}
                className={`
                  p-6 rounded-2xl border cursor-pointer
                  transition-all duration-300
                  ${selectedItem === `rec-${idx}`
                    ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/50 ring-2 ring-emerald-400/30 scale-[1.02]'
                    : 'bg-white/5 border-white/10 hover:border-emerald-400/30 hover:scale-[1.01]'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-light text-white/95 mb-2">{rec.recommendation}</h4>
                    <span className={`text-xs px-3 py-1 rounded-full border uppercase tracking-wider ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <div className="text-right">
                      <div className="text-sm font-light text-emerald-400">
                        {rec.expected_impact}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Rationale</div>
                    <div className="text-sm text-white/80 font-light">{rec.rationale}</div>
                  </div>

                  {selectedItem === `rec-${idx}` && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-3 border-t border-white/20"
                    >
                      <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Implementation</div>
                      <div className="text-sm text-white/80 font-light">{rec.implementation}</div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  전략적 추천 데이터가 없습니다.
                </p>
              </div>
            )}
          </>
        )}

        {/* Emerging Trends Section */}
        {selectedSection === 'trends' && (
          <>
            {data.emerging_trends && Array.isArray(data.emerging_trends) && data.emerging_trends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.emerging_trends.map((trend, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="p-6 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-lg font-light text-white/95">{trend.trend}</h4>
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-400/20">
                    <div className="text-xs text-purple-300 mb-1 uppercase tracking-wider">Evidence</div>
                    <div className="text-sm text-white/80 font-light">{trend.evidence}</div>
                  </div>

                  <div className="p-3 rounded-lg border" style={{
                    backgroundColor: trend.laneige_preparedness.toLowerCase() === 'high' ? 'rgba(16, 185, 129, 0.1)' :
                                     trend.laneige_preparedness.toLowerCase() === 'medium' ? 'rgba(59, 130, 246, 0.1)' :
                                     'rgba(251, 191, 36, 0.1)',
                    borderColor: trend.laneige_preparedness.toLowerCase() === 'high' ? 'rgba(16, 185, 129, 0.3)' :
                                 trend.laneige_preparedness.toLowerCase() === 'medium' ? 'rgba(59, 130, 246, 0.3)' :
                                 'rgba(251, 191, 36, 0.3)'
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-white/50 uppercase tracking-wider">LANEIGE Preparedness</div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        trend.laneige_preparedness.toLowerCase() === 'high' ? 'text-emerald-400 border-emerald-400/30' :
                        trend.laneige_preparedness.toLowerCase() === 'medium' ? 'text-blue-400 border-blue-400/30' :
                        'text-amber-400 border-amber-400/30'
                      }`}>
                        {trend.laneige_preparedness}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                    <div className="text-xs text-emerald-300 mb-1 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      Action Required
                    </div>
                    <div className="text-sm text-white/80 font-light">{trend.action_required}</div>
                  </div>
                </div>
              </motion.div>
            ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  Emerging 트렌드 데이터가 없습니다.
                </p>
              </div>
            )}
          </>
        )}

        {/* Keyword Analysis Section */}
        {selectedSection === 'keywords' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {data.review_keyword_analysis ? (
              <div className="space-y-8">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                    <div className="text-xs text-white/50 mb-2">Analysis Period</div>
                    <div className="text-lg font-light text-white/90">{data.review_keyword_analysis.analysis_period || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                    <div className="text-xs text-white/50 mb-2">Total Reviews Analyzed</div>
                    <div className="text-lg font-light text-white/90">{(data.review_keyword_analysis.total_reviews_analyzed || 0).toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                    <div className="text-xs text-white/50 mb-2">Brands Compared</div>
                    <div className="text-lg font-light text-white/90">{(data.review_keyword_analysis.brand_perception_comparison || []).length}</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                    <div className="text-xs text-white/50 mb-2">Keyword Dimensions</div>
                    <div className="text-lg font-light text-white/90">{Object.keys(data.review_keyword_analysis.keyword_battle_analysis || {}).length}</div>
                  </div>
                </div>

                {/* Brand Perception Comparison */}
                {data.review_keyword_analysis.brand_perception_comparison && (
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-light text-white/90 mb-6 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-purple-400" />
                      Brand Perception Comparison
                    </h4>

                    {/* Brand Selector */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {data.review_keyword_analysis.brand_perception_comparison.map((brand) => (
                        <motion.button
                          key={brand.brand}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedKeywordBrand(selectedKeywordBrand === brand.brand ? null : brand.brand)}
                          className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                            selectedKeywordBrand === brand.brand
                              ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                              : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
                          }`}
                        >
                          {brand.brand}
                          <span className="ml-2 text-xs text-white/40">({brand.total_reviews?.toLocaleString() || 0})</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Selected Brand Details */}
                    {selectedKeywordBrand && (() => {
                      const brandData = data.review_keyword_analysis.brand_perception_comparison.find(b => b.brand === selectedKeywordBrand);
                      if (!brandData) return null;

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          {/* Brand Overview */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-400/20 text-center">
                              <div className="text-xs text-purple-300 mb-2">Perception Score</div>
                              <div className="text-2xl font-light text-white/90">{brandData.brand_perception_score || 'N/A'}</div>
                            </div>
                            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-400/20 text-center">
                              <div className="text-xs text-amber-300 mb-2">Avg Rating</div>
                              <div className="text-2xl font-light text-white/90">⭐ {brandData.avg_rating || 'N/A'}</div>
                            </div>
                            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-400/20 text-center">
                              <div className="text-xs text-emerald-300 mb-2">Total Reviews</div>
                              <div className="text-2xl font-light text-white/90">{(brandData.total_reviews || 0).toLocaleString()}</div>
                            </div>
                            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/20 text-center">
                              <div className="text-xs text-blue-300 mb-2">Associations</div>
                              <div className="text-lg font-light text-white/90">{(brandData.unique_associations || []).length}</div>
                            </div>
                          </div>

                          {/* Key Insight */}
                          {brandData.key_insight && (
                            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-400/20">
                              <div className="text-xs text-purple-300 mb-2 uppercase tracking-wider">Key Insight</div>
                              <div className="text-sm text-white/80 font-light">{brandData.key_insight}</div>
                            </div>
                          )}

                          {/* Keywords Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Positive Keywords */}
                            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                              <h5 className="text-sm text-emerald-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Positive Keywords
                              </h5>
                              <div className="space-y-2">
                                {(brandData.positive_keywords || []).slice(0, 6).map((kw, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 bg-black/20 rounded">
                                    <span className="text-sm text-white/80">{kw.keyword}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-white/50">{kw.frequency?.toLocaleString() || 0} mentions</span>
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                        {((kw.sentiment || 0) * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Negative Keywords */}
                            <div className="p-4 bg-rose-500/10 rounded-lg border border-rose-400/20">
                              <h5 className="text-sm text-rose-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Negative Keywords
                              </h5>
                              <div className="space-y-2">
                                {(brandData.negative_keywords || []).slice(0, 4).map((kw, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 bg-black/20 rounded">
                                    <span className="text-sm text-white/80">{kw.keyword}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-white/50">{kw.frequency?.toLocaleString() || 0} mentions</span>
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                                        {((kw.sentiment || 0) * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Unique Associations */}
                          {brandData.unique_associations && brandData.unique_associations.length > 0 && (
                            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                              <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Unique Brand Associations</div>
                              <div className="flex flex-wrap gap-2">
                                {brandData.unique_associations.map((assoc, i) => (
                                  <span key={i} className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-sm">
                                    {assoc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })()}

                    {!selectedKeywordBrand && (
                      <div className="text-center py-8">
                        <p className="text-white/60 text-sm">
                          브랜드를 선택하여 키워드 분석을 확인하세요.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Keyword Battle Analysis */}
                {data.review_keyword_analysis.keyword_battle_analysis && (
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-light text-white/90 mb-6 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-400" />
                      Keyword Battle Analysis
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Object.entries(data.review_keyword_analysis.keyword_battle_analysis).map(([dimension, info], idx) => (
                        <motion.div
                          key={dimension}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + idx * 0.1 }}
                          className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/20"
                        >
                          <h5 className="text-sm font-medium text-white/90 mb-2 capitalize">
                            {dimension.replace(/_/g, ' ')}
                          </h5>
                          <p className="text-xs text-white/50 mb-4">{info.description}</p>

                          {/* Rankings Bar Chart */}
                          <div className="space-y-2">
                            {(info.rankings || []).map((rank, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-20 text-xs text-white/70 truncate">{rank.brand}</div>
                                <div className="flex-1 h-6 bg-black/30 rounded overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${rank.score}%` }}
                                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                                    className={`h-full rounded ${
                                      rank.brand === 'LANEIGE' ? 'bg-gradient-to-r from-purple-500 to-blue-500' :
                                      i === 0 ? 'bg-emerald-500/70' :
                                      'bg-white/20'
                                    }`}
                                  />
                                </div>
                                <div className="w-10 text-xs text-white/70 text-right">{rank.score}</div>
                              </div>
                            ))}
                          </div>

                          {/* LANEIGE Position */}
                          {info.laneige_position && (
                            <div className="mt-4 p-2 bg-purple-500/20 rounded border border-purple-400/30">
                              <div className="text-xs text-purple-300">LANEIGE Position: {info.laneige_position}</div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  키워드 분석 데이터를 수집 중입니다.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </GlassCard>

      {/* Competitive Intelligence Summary */}
      {data.competitive_intelligence && (
        <GlassCard delay={0.6} className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">
              Competitive Intelligence
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.competitive_intelligence.map((comp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="p-6 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-lg font-light text-white/95">{comp.competitor}</h4>
                  <span className={`text-xs px-3 py-1 rounded-full border ${
                    comp.threat_level.toLowerCase().includes('high') ? 'text-rose-400 border-rose-400/40 bg-rose-500/10' :
                    comp.threat_level.toLowerCase().includes('medium') ? 'text-amber-400 border-amber-400/40 bg-amber-500/10' :
                    'text-emerald-400 border-emerald-400/40 bg-emerald-500/10'
                  }`}>
                    {comp.threat_level.replace('threat_level: ', '')}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                    <div className="text-xs text-emerald-300 mb-2 uppercase tracking-wider">Strength</div>
                    <div className="text-sm text-white/80 font-light">{comp.strength}</div>
                  </div>

                  <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-400/20">
                    <div className="text-xs text-rose-300 mb-2 uppercase tracking-wider">Weakness</div>
                    <div className="text-sm text-white/80 font-light">{comp.weakness}</div>
                  </div>

                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-400/20">
                    <div className="text-xs text-blue-300 mb-2 uppercase tracking-wider">LANEIGE Opportunity</div>
                    <div className="text-sm text-white/80 font-light">{comp.laneige_opportunity}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Brand Perception Gaps */}
      {data.brand_perception_gaps && (
        <GlassCard delay={0.8} className="p-8 scan-line">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">
              Brand Perception Gaps
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {data.brand_perception_gaps.map((gap, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + idx * 0.1 }}
                className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30"
              >
                <ScanningText delay={0.9 + idx * 0.1}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-amber-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Gap
                      </div>
                      <div className="text-sm font-medium text-white/90 mb-2">{gap.gap}</div>
                      <div className="text-xs text-white/70 font-light">{gap.evidence}</div>
                    </div>

                    <div>
                      <div className="text-xs text-rose-300 mb-2 uppercase tracking-wider">Impact</div>
                      <div className="text-sm text-white/80 font-light">{gap.impact}</div>
                    </div>

                    <div>
                      <div className="text-xs text-emerald-300 mb-2 uppercase tracking-wider">Solution</div>
                      <div className="text-sm text-white/80 font-light">{gap.solution}</div>
                    </div>
                  </div>
                </ScanningText>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
