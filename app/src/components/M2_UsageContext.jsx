import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, FloatingBubble } from './GlassCard';
import { MessageSquare, Clock, Calendar, Target, Users, Package, Star, ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Import product details to check availability
import productDetailsData from '../data/product_details.json';

export const UsageContext = ({ data, onProductClick }) => {
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [selectedContext, setSelectedContext] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState({});

  if (!data || !data.products || !Array.isArray(data.products) || data.products.length === 0) {
    return (
      <GlassCard delay={0.2} className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">
            Usage Context Analysis
          </h3>
        </div>
        <div className="text-center py-12">
          <p className="text-white/60 text-sm">
            사용 맥락 분석 데이터를 수집 중입니다. 데이터 수집이 완료되면 업데이트됩니다.
          </p>
        </div>
      </GlassCard>
    );
  }

  const product = data.products[selectedProduct];

  // Safe data extraction with fallbacks
  const skinTypeData = product?.demographic_insights?.skin_types
    ? Object.entries(product.demographic_insights.skin_types).map(([type, percentage]) => ({
        name: type,
        value: percentage,
      }))
    : [];

  const COLORS = ['#9333EA', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

  const toggleReviews = (contextIndex) => {
    setExpandedReviews(prev => ({
      ...prev,
      [contextIndex]: !prev[contextIndex]
    }));
  };

  return (
    <GlassCard delay={0.2} className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">
            Usage Context Analysis
          </h3>
        </div>

        {/* Product Selector */}
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-white/50 uppercase tracking-wider">Select Product:</span>
          <span className="text-xs text-purple-300/60 italic ml-2">(더블클릭으로 상세 정보 보기)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.products.map((p, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedProduct(idx);
                setSelectedContext(null);
                setExpandedReviews({});
              }}
              onDoubleClick={() => onProductClick && onProductClick(p.brand, p.product, p.asin)}
              className={`
                px-4 py-2 rounded-lg text-sm font-light transition-all
                ${selectedProduct === idx
                  ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:border-purple-400/30'
                }
              `}
              title="더블클릭하여 상세 정보 보기"
            >
              <div className="text-left">
                <div className="font-medium flex items-center gap-2">
                  {p.brand}
                  {p.asin && productDetailsData[p.asin] && (
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="상세 정보 있음" />
                  )}
                </div>
                <div className="text-xs opacity-70">{p.product}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h4 className="text-sm text-white/50 uppercase tracking-wider mb-4">
              Usage Contexts
            </h4>
          </div>

          <div className="space-y-4">
            {(product.usage_contexts || []).map((context, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                onClick={() => setSelectedContext(selectedContext === idx ? null : idx)}
                className={`
                  p-5 rounded-xl border cursor-pointer
                  transition-all duration-300 hover:scale-[1.02]
                  ${selectedContext === idx
                    ? 'bg-purple-500/20 border-purple-400/40 ring-2 ring-purple-400/30'
                    : 'bg-white/5 border-white/10 hover:border-purple-400/30'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="text-white/90 font-light mb-2">
                      {context.context}
                    </h5>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {context.key_phrases.slice(0, 3).map((phrase, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30"
                        >
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extralight text-white/95">
                      {context.frequency}
                    </div>
                    <div className="text-xs text-white/50">mentions</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className="w-full h-2 rounded-full bg-white/10 overflow-hidden"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        style={{ width: `${context.sentiment_score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-emerald-400 whitespace-nowrap">
                      {(context.sentiment_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-white/50" />
                    <span className="text-xs text-white/70">{context.time_of_use}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-white/50" />
                    <span className="text-xs text-white/70">{context.season}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedContext === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="space-y-2">
                        <div className="text-xs text-white/50">Skin Concerns:</div>
                        <div className="flex flex-wrap gap-2">
                          {context.skin_concerns.map((concern, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30"
                            >
                              {concern}
                            </span>
                          ))}
                        </div>
                        {context.companion_products && (
                          <div className="mt-3">
                            <div className="text-xs text-white/50 mb-2">Often Used With:</div>
                            <div className="flex flex-wrap gap-2">
                              {(context.companion_products || []).map((prod, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30"
                                >
                                  {prod}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reviews Section */}
                        {context.sample_reviews && context.sample_reviews.length > 0 && (
                          <div className="mt-4">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReviews(idx);
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-400/30 hover:bg-blue-500/20 transition-all text-sm text-blue-200"
                            >
                              {expandedReviews[idx] ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Hide Reviews ({context.sample_reviews.length})
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  View Reviews ({context.sample_reviews.length})
                                </>
                              )}
                            </motion.button>

                            <AnimatePresence>
                              {expandedReviews[idx] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 space-y-3"
                                >
                                  {(context.sample_reviews || []).map((review, reviewIdx) => (
                                    <motion.div
                                      key={reviewIdx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: reviewIdx * 0.1 }}
                                      className="p-4 rounded-lg bg-white/5 border border-white/10"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-1">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-4 h-4 ${
                                                i < review.rating
                                                  ? 'fill-yellow-400 text-yellow-400'
                                                  : 'text-white/20'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        {review.verified && (
                                          <div className="flex items-center gap-1 text-xs text-emerald-400">
                                            <BadgeCheck className="w-4 h-4" />
                                            <span>Verified</span>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-sm text-white/70 leading-relaxed">
                                        "{review.text}"
                                      </p>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Skin Type Distribution
            </h4>
            {skinTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200} minHeight={200}>
                <PieChart>
                <Pie
                  data={skinTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {skinTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 14, 39, 0.95)',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                  itemStyle={{
                    color: '#ffffff',
                  }}
                  labelStyle={{
                    color: '#ffffff',
                  }}
                />
              </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/50 text-xs">데이터 없음</p>
              </div>
            )}
            <div className="mt-4 space-y-2">
              {skinTypeData.map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-white/70">{entry.name}</span>
                  </div>
                  <span className="text-white/90 font-light">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {product.strategic_targeting && product.strategic_targeting.length > 0 && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30">
              <h4 className="text-sm text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                Strategic Targeting
              </h4>
              <div className="space-y-4">
                {(product.strategic_targeting || []).map((target, i) => (
                  <div key={i} className="space-y-2">
                    <div className="text-sm text-white/90 font-medium">
                      {target.scenario}
                    </div>
                    <div className="text-xs text-white/60 font-light">
                      {target.rationale}
                    </div>
                    <div className="text-xs text-amber-300 font-light mt-2 p-2 bg-black/20 rounded">
                      → {target.recommended_action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
