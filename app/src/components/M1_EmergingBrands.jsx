import { motion } from 'framer-motion';
import { GlassCard, FloatingBubble } from './GlassCard';
import { Rocket, TrendingUp, AlertTriangle, Shield, Target, Lightbulb, Star, Package, BarChart3, DollarSign, Calendar, Layout } from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export const EmergingBrands = ({ data }) => {
  const [selectedSection, setSelectedSection] = useState('emerging'); // 'emerging', 'laneige', 'trends', 'swot', 'price', 'seasonal'
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedSwotBrand, setSelectedSwotBrand] = useState(null);

  if (!data) return null;

  const getEmergenceColor = (score) => {
    if (score >= 8) return 'from-rose-500/20 to-pink-500/20 border-rose-400/40';
    if (score >= 6) return 'from-purple-500/20 to-blue-500/20 border-purple-400/40';
    return 'from-blue-500/20 to-cyan-500/20 border-blue-400/40';
  };

  const getThreatColor = (threat) => {
    if (!threat) return 'text-emerald-400';
    const threatLower = threat.toLowerCase();
    if (threatLower.includes('very high') || threatLower.includes('high'))
      return 'text-rose-400';
    if (threatLower.includes('medium')) return 'text-amber-400';
    return 'text-emerald-400';
  };

  // Category growth data for chart - with safety check
  const categoryGrowthData = data.category_growth_rates && typeof data.category_growth_rates === 'object'
    ? Object.entries(data.category_growth_rates).map(([category, growth]) => ({
        category: category.replace(/_/g, ' '),
        rate: parseFloat(growth.match(/\d+/)?.[0] || 0),
      }))
    : [];

  return (
    <div className="space-y-6">
      <GlassCard delay={0.4} className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Rocket className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">
              Competitive Intelligence
            </h3>
          </div>

          {/* Section Toggle */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('emerging')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'emerging'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              Emerging Brands
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('laneige')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'laneige'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              LANEIGE Position
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
              Market Trends
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('swot')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'swot'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              SWOT Analysis
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('price')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'price'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              Price Analysis
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSection('seasonal')}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                selectedSection === 'seasonal'
                  ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              Seasonal Trends
            </motion.button>
          </div>
        </div>

        {/* Emerging Brands Section */}
        {selectedSection === 'emerging' && (
          <>
            {data.emerging_brands && Array.isArray(data.emerging_brands) && data.emerging_brands.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {data.emerging_brands.map((brand, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.15 }}
                  onClick={() => setSelectedBrand(selectedBrand === idx ? null : idx)}
                  className={`
                    cursor-pointer p-6 rounded-2xl border
                    bg-gradient-to-br ${getEmergenceColor(brand.emergence_score)}
                    hover:scale-[1.02] transition-all duration-300
                    ${selectedBrand === idx ? 'ring-2 ring-purple-400/50' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-2xl font-light text-white/95 mb-2">{brand.brand}</h4>
                      <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 uppercase tracking-wider">
                        {brand.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-3xl font-extralight text-white/95">
                        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                        {brand.emergence_score}
                      </div>
                      <div className="text-xs text-white/50">Emergence Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="text-xs text-white/50 mb-1">Total Reviews</div>
                      <div className="text-xl font-extralight text-white/95">
                        {brand.metrics.total_reviews.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="text-xs text-white/50 mb-1">Growth Rate</div>
                      <div className="text-xl font-extralight text-emerald-400">
                        {brand.metrics.review_growth_rate}
                      </div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="text-xs text-white/50 mb-1">Avg Rating</div>
                      <div className="text-xl font-extralight text-white/95">
                        ⭐ {brand.metrics.avg_rating}
                      </div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-lg">
                      <div className="text-xs text-white/50 mb-1 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Products
                      </div>
                      <div className="text-xl font-extralight text-white/95">
                        {brand.metrics.product_count}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-black/20 rounded-lg">
                    <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">
                      Category Penetration
                    </div>
                    <div className="text-sm text-white/80 font-light">
                      {brand.metrics.category_penetration}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${getThreatColor(brand.threat_assessment)} bg-black/20`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-5 h-5 ${getThreatColor(brand.threat_assessment)} flex-shrink-0 mt-0.5`} />
                      <div>
                        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                          Threat Assessment
                        </div>
                        <div className={`text-sm font-medium mb-2 ${getThreatColor(brand.threat_assessment)}`}>
                          {brand.threat_assessment}
                        </div>
                        <div className="text-xs text-blue-300 p-2 bg-blue-500/10 rounded border border-blue-400/20">
                          <span className="font-medium">Response:</span> {brand.laneige_response}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedBrand === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-white/20"
                    >
                      <div className="text-xs text-white/50 uppercase tracking-wider mb-3">
                        Key Differentiators
                      </div>
                      <div className="space-y-2">
                        {brand.key_differentiators.map((diff, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-purple-400 flex-shrink-0">•</span>
                            <span className="text-white/70 font-light">{diff}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  Emerging 브랜드 데이터를 수집 중입니다.
                </p>
              </div>
            )}

            {/* Established Competitors */}
            {data.established_competitors && data.established_competitors.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Established Competitors
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {data.established_competitors.map((competitor, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + idx * 0.1 }}
                      className="p-6 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h5 className="text-lg font-light text-white/90 mb-1">{competitor.brand}</h5>
                          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                            {competitor.market_position}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-right">
                          <div>
                            <div className="text-xl font-extralight text-white/95">
                              {competitor.metrics.total_reviews.toLocaleString()}
                            </div>
                            <div className="text-xs text-white/50">Reviews</div>
                          </div>
                          <div>
                            <div className="text-xl font-extralight text-white/95">
                              ⭐ {competitor.metrics.avg_rating}
                            </div>
                            <div className="text-xs text-white/50">Rating</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-black/20 rounded-lg">
                          <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">
                            Competitive Moat
                          </div>
                          <ul className="space-y-1">
                            {competitor.competitive_moat.slice(0, 3).map((moat, i) => (
                              <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                                <span className="text-emerald-400">✓</span>
                                {moat}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-rose-500/10 rounded-lg border border-rose-400/20">
                          <div className="text-xs text-rose-300 mb-2 uppercase tracking-wider">
                            Threat Assessment
                          </div>
                          <div className="text-sm text-white/80 font-light mb-3">
                            {competitor.threat_assessment}
                          </div>
                          <div className="text-xs text-blue-300 p-2 bg-blue-500/10 rounded">
                            <span className="font-medium">Response:</span> {competitor.laneige_response}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* LANEIGE Position Section */}
        {selectedSection === 'laneige' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {data.laneige_position && typeof data.laneige_position === 'object' ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-400/30">
                    <h4 className="text-sm text-emerald-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-3">
                      {(data.laneige_position.strengths || []).map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-400 flex-shrink-0 text-lg">✓</span>
                      <span className="text-white/80 font-light">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30">
                <h4 className="text-sm text-amber-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Vulnerabilities
                </h4>
                <ul className="space-y-3">
                  {(data.laneige_position.vulnerabilities || []).map((vuln, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-400 flex-shrink-0">⚠</span>
                      <span className="text-white/80 font-light">{vuln}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30">
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-purple-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm text-purple-300 uppercase tracking-wider mb-3">
                    Strategic Positioning
                  </h4>
                  <p className="text-white/80 font-light leading-relaxed">
                    {data.laneige_position.strategic_positioning}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                <div className="text-xs text-white/50 mb-2">Total Reviews</div>
                <div className="text-2xl font-extralight text-white/95">
                  {data.laneige_position.metrics?.total_reviews_analyzed?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                <div className="text-xs text-white/50 mb-2">Avg Rating</div>
                <div className="text-2xl font-extralight text-white/95">
                  ⭐ {data.laneige_position.metrics?.avg_rating || 'N/A'}
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                <div className="text-xs text-white/50 mb-2">Products</div>
                <div className="text-2xl font-extralight text-white/95">
                  {data.laneige_position.metrics?.product_count || 'N/A'}
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                <div className="text-xs text-white/50 mb-2">Categories</div>
                <div className="text-sm font-light text-white/90 mt-1">
                  {data.laneige_position.metrics?.category_penetration || 'N/A'}
                </div>
              </div>
            </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  LANEIGE 포지션 데이터를 수집 중입니다.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Market Trends Section */}
        {selectedSection === 'trends' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Category Growth Chart */}
            {categoryGrowthData.length > 0 ? (
              <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-sm text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Category Growth Rates (YoY)
                </h4>
                <ResponsiveContainer width="100%" height={300} minHeight={300}>
                  <BarChart data={categoryGrowthData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    type="number"
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.7)' }}
                    label={{ value: 'Growth Rate (%)', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '11px', fill: 'rgba(255,255,255,0.7)' }}
                    width={150}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 14, 39, 0.95)',
                      border: '1px solid rgba(147, 51, 234, 0.3)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
                    {categoryGrowthData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`rgba(147, 51, 234, ${0.5 + (entry.rate / 100)})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  카테고리 성장률 데이터를 수집 중입니다.
                </p>
              </div>
            )}

            {/* Market Trends */}
            {data.market_trends && Array.isArray(data.market_trends) && data.market_trends.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.market_trends.map((trend, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="p-6 rounded-xl bg-white/5 border border-white/10"
                >
                  <h5 className="text-lg font-light text-white/90 mb-4">{trend.trend}</h5>

                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-400/20">
                      <div className="text-xs text-purple-300 mb-1 uppercase tracking-wider">Leaders</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {trend.leaders.map((leader, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200">
                            {leader}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-400/20">
                      <div className="text-xs text-amber-300 mb-1 uppercase tracking-wider">LANEIGE Gap</div>
                      <div className="text-sm text-white/80 font-light">{trend.laneige_gap}</div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                      <div className="text-xs text-emerald-300 mb-1 uppercase tracking-wider">Recommendation</div>
                      <div className="text-sm text-white/80 font-light">{trend.recommendation}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
              </div>
            )}
          </motion.div>
        )}

        {/* SWOT Analysis Section */}
        {selectedSection === 'swot' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Build swot_analysis from emerging_brands and established_competitors */}
            {(() => {
              const swotAnalysis = {};
              // Extract SWOT from emerging brands
              (data.emerging_brands || []).forEach(brand => {
                if (brand.swot) {
                  swotAnalysis[brand.brand] = {
                    ...brand.swot,
                    strategic_implication: brand.laneige_response
                  };
                }
              });
              // Extract SWOT from established competitors
              (data.established_competitors || []).forEach(comp => {
                if (comp.swot) {
                  swotAnalysis[comp.brand] = {
                    ...comp.swot,
                    strategic_implication: comp.laneige_response
                  };
                }
              });
              return Object.keys(swotAnalysis).length > 0 ? (
              <>
                {/* SWOT Brand Selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {Object.keys(swotAnalysis).map((brand) => (
                    <motion.button
                      key={brand}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSwotBrand(selectedSwotBrand === brand ? null : brand)}
                      className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                        selectedSwotBrand === brand
                          ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                          : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
                      }`}
                    >
                      {brand}
                    </motion.button>
                  ))}
                </div>

                {/* SWOT Display for Selected Brand */}
                {selectedSwotBrand && swotAnalysis[selectedSwotBrand] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-400/30">
                        <h4 className="text-sm text-emerald-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Strengths
                        </h4>
                        <ul className="space-y-2">
                          {(swotAnalysis[selectedSwotBrand].strengths || []).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-emerald-400 flex-shrink-0">✓</span>
                              <span className="text-white/80 font-light">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="p-6 rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-400/30">
                        <h4 className="text-sm text-rose-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Weaknesses
                        </h4>
                        <ul className="space-y-2">
                          {(swotAnalysis[selectedSwotBrand].weaknesses || []).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-rose-400 flex-shrink-0">✗</span>
                              <span className="text-white/80 font-light">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Opportunities */}
                      <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30">
                        <h4 className="text-sm text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Opportunities
                        </h4>
                        <ul className="space-y-2">
                          {(swotAnalysis[selectedSwotBrand].opportunities || []).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-blue-400 flex-shrink-0">◆</span>
                              <span className="text-white/80 font-light">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Threats */}
                      <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30">
                        <h4 className="text-sm text-amber-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Threats
                        </h4>
                        <ul className="space-y-2">
                          {(swotAnalysis[selectedSwotBrand].threats || []).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-amber-400 flex-shrink-0">⚠</span>
                              <span className="text-white/80 font-light">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Strategic Implications */}
                    {swotAnalysis[selectedSwotBrand].strategic_implication && (
                      <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30">
                        <div className="flex items-start gap-3">
                          <Target className="w-6 h-6 text-purple-400 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm text-purple-300 uppercase tracking-wider mb-3">
                              LANEIGE Strategic Implication
                            </h4>
                            <p className="text-white/80 font-light leading-relaxed">
                              {swotAnalysis[selectedSwotBrand].strategic_implication}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {!selectedSwotBrand && (
                  <div className="text-center py-12">
                    <p className="text-white/60 text-sm">
                      브랜드를 선택하여 SWOT 분석을 확인하세요.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  SWOT 분석 데이터를 수집 중입니다.
                </p>
              </div>
            );
            })()}
          </motion.div>
        )}

        {/* Price Analysis Section */}
        {selectedSection === 'price' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {data.price_segment_analysis && typeof data.price_segment_analysis === 'object' ? (
              <div className="space-y-8">
                {Object.entries(data.price_segment_analysis)
                  .filter(([key]) => key.includes('category'))
                  .map(([category, segments], catIdx) => (
                  <div key={category} className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-light text-white/90 mb-6 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      {category.replace(/_category/g, '').replace(/_/g, ' ').toUpperCase()}
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                      {Object.entries(segments).map(([segment, info], segIdx) => (
                        <motion.div
                          key={segment}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + segIdx * 0.1 }}
                          className={`p-4 rounded-lg border ${
                            segment?.toLowerCase() === 'premium' ? 'bg-purple-500/10 border-purple-400/30' :
                            segment?.toLowerCase() === 'luxury' ? 'bg-amber-500/10 border-amber-400/30' :
                            segment?.toLowerCase() === 'mid_range' ? 'bg-blue-500/10 border-blue-400/30' :
                            'bg-emerald-500/10 border-emerald-400/30'
                          }`}
                        >
                          <h5 className="text-sm font-medium text-white/90 mb-2">
                            {segment.replace(/_/g, ' ')}
                          </h5>
                          <div className="text-xs text-white/50 mb-3">
                            {info.price_range}
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs text-white/50 uppercase tracking-wider">Key Players</div>
                            <div className="flex flex-wrap gap-1">
                              {(info.key_players || []).map((player, i) => (
                                <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
                                  player.includes('LANEIGE') ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-white/70'
                                }`}>
                                  {player}
                                </span>
                              ))}
                            </div>
                          </div>

                          {info.laneige_position && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="text-xs text-purple-300 mb-1">LANEIGE Position</div>
                              <div className="text-xs text-white/70">{info.laneige_position}</div>
                            </div>
                          )}

                          {info.market_share && (
                            <div className="mt-2">
                              <div className="text-xs text-white/50">Market Share</div>
                              <div className="text-sm text-white/90">{info.market_share}</div>
                            </div>
                          )}

                          {info.consumer_profile && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <div className="text-xs text-white/50">Consumer Profile</div>
                              <div className="text-xs text-white/70 mt-1">{info.consumer_profile}</div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Strategic Implications */}
                {data.price_segment_analysis.strategic_implications && (
                  <div className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-400/30">
                    <h4 className="text-lg font-light text-white/90 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      Strategic Implications
                    </h4>
                    <div className="space-y-3">
                      {data.price_segment_analysis.strategic_implications.map((impl, idx) => (
                        <div key={idx} className="p-3 bg-black/20 rounded-lg">
                          <div className="text-sm text-white/80 font-medium mb-1">{impl.insight}</div>
                          <div className="text-xs text-purple-300">{impl.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  가격대별 분석 데이터를 수집 중입니다.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Seasonal Trends Section */}
        {selectedSection === 'seasonal' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {data.seasonal_trends ? (
              <div className="space-y-8">
                {/* Product Category Seasonal Trends */}
                {['lip_care', 'sleeping_masks'].map((category) => (
                  data.seasonal_trends[category] && (
                    <div key={category} className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-lg font-light text-white/90 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        {category === 'lip_care' ? 'Lip Care' : 'Sleeping Masks'} - Quarterly Trends
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(data.seasonal_trends[category]).map(([quarter, info], idx) => {
                          // Determine demand level based on demand_index
                          const demandLevel = info.demand_index >= 130 ? 'Very High' :
                                              info.demand_index >= 110 ? 'High' :
                                              info.demand_index >= 90 ? 'Medium' : 'Low';
                          return (
                            <motion.div
                              key={quarter}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + idx * 0.1 }}
                              className={`p-4 rounded-lg border ${
                                demandLevel === 'Very High' ? 'bg-rose-500/10 border-rose-400/30' :
                                demandLevel === 'High' ? 'bg-amber-500/10 border-amber-400/30' :
                                demandLevel === 'Medium' ? 'bg-blue-500/10 border-blue-400/30' :
                                'bg-emerald-500/10 border-emerald-400/30'
                              }`}
                            >
                              <h5 className="text-lg font-medium text-white/90 mb-2">{quarter.replace(/_/g, ' ')}</h5>
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`text-2xl font-light ${
                                  demandLevel === 'Very High' ? 'text-rose-300' :
                                  demandLevel === 'High' ? 'text-amber-300' :
                                  demandLevel === 'Medium' ? 'text-blue-300' :
                                  'text-emerald-300'
                                }`}>
                                  {info.demand_index}
                                </span>
                                <span className="text-xs text-white/50">Demand Index</span>
                              </div>

                              {info.peak_month && (
                                <div className="text-xs text-white/70 mb-2">
                                  Peak: <span className="text-purple-300">{info.peak_month}</span>
                                </div>
                              )}

                              <div className="space-y-2">
                                {info.key_drivers && (
                                  <div>
                                    <div className="text-xs text-white/50 uppercase tracking-wider">Key Drivers</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {info.key_drivers.map((driver, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                          {driver}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {info.top_search_terms && (
                                  <div>
                                    <div className="text-xs text-white/50 uppercase tracking-wider">Top Search Terms</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {info.top_search_terms.slice(0, 3).map((term, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200">
                                          {term}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {info.laneige_opportunity && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                  <div className="text-xs text-purple-300 mb-1">LANEIGE Opportunity</div>
                                  <div className="text-xs text-white/70">{info.laneige_opportunity}</div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ))}

                {/* Yearly Marketing Calendar */}
                {data.seasonal_trends.yearly_calendar && (
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-light text-white/90 mb-6 flex items-center gap-2">
                      <Layout className="w-5 h-5 text-purple-400" />
                      Yearly Marketing Calendar
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                      {data.seasonal_trends.yearly_calendar.map((item, idx) => {
                        // Determine priority based on event type
                        const priority = ['Black Friday', 'Prime Day', 'Holiday'].some(e => item.event.includes(e)) ? 'Critical' :
                                        ['Valentine', 'Mother', 'New Year'].some(e => item.event.includes(e)) ? 'High' : 'Medium';
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + idx * 0.05 }}
                            className={`p-3 rounded-lg border ${
                              priority === 'Critical' ? 'bg-rose-500/10 border-rose-400/30' :
                              priority === 'High' ? 'bg-amber-500/10 border-amber-400/30' :
                              'bg-blue-500/10 border-blue-400/30'
                            }`}
                          >
                            <h5 className="text-sm font-medium text-white/90 mb-1">{item.month}</h5>
                            <div className="text-xs text-white/50 mb-2">{item.event}</div>
                            <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                              priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                              priority === 'High' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {priority}
                            </div>
                            {item.focus && (
                              <div className="mt-2 text-xs text-purple-300">{item.focus}</div>
                            )}
                            {item.promo_type && (
                              <div className="mt-1 text-xs text-white/50">{item.promo_type}</div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-sm">
                  시즌별 트렌드 데이터를 수집 중입니다.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
};
