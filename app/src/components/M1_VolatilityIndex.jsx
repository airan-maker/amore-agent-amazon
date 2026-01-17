import { motion } from 'framer-motion';
import { GlassCard, MetricDisplay } from './GlassCard';
import { Activity, TrendingUp, TrendingDown, Package, AlertCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState } from 'react';

export const VolatilityIndex = ({ data }) => {
  const [selectedView, setSelectedView] = useState('brands'); // 'brands' or 'categories'

  if (!data) return null;

  // Check if data has the expected structure
  const hasVolatilityMetrics = data.volatility_metrics && typeof data.volatility_metrics === 'object';
  const hasCategoryVolatility = data.category_volatility && typeof data.category_volatility === 'object';

  // If neither structure exists, return a message
  if (!hasVolatilityMetrics && !hasCategoryVolatility) {
    return (
      <GlassCard delay={0.3} className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">
            Volatility Index Tracking
          </h3>
        </div>
        <div className="text-center py-12">
          <p className="text-white/60 text-sm">
            변동성 데이터를 수집 중입니다. 오늘 11시에 데이터가 업데이트됩니다.
          </p>
        </div>
      </GlassCard>
    );
  }

  const getVolatilityColor = (score) => {
    if (score >= 6) return 'text-rose-400 border-rose-400/40 bg-rose-500/10';
    if (score >= 4) return 'text-amber-400 border-amber-400/40 bg-amber-500/10';
    if (score >= 2.5) return 'text-blue-400 border-blue-400/40 bg-blue-500/10';
    return 'text-emerald-400 border-emerald-400/40 bg-emerald-500/10';
  };

  const getVolatilityLabel = (score) => {
    if (score >= 6) return 'HIGH VOLATILITY';
    if (score >= 4) return 'MODERATE';
    if (score >= 2.5) return 'LOW-MODERATE';
    return 'VERY LOW';
  };

  // Brand volatility chart data - with safety check
  const brandChartData = hasVolatilityMetrics
    ? Object.entries(data.volatility_metrics).map(([brand, metrics]) => ({
        brand,
        score: metrics.brand_volatility_score,
      }))
    : [];

  // Category volatility chart data - with safety check
  const categoryChartData = hasCategoryVolatility
    ? Object.entries(data.category_volatility).map(([category, metrics]) => ({
        category: category.replace(/_/g, ' '),
        score: metrics.score,
      }))
    : [];

  return (
    <GlassCard delay={0.3} className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">
            Volatility Index Tracking
          </h3>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedView('brands')}
            className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
              selectedView === 'brands'
                ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            By Brands
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedView('categories')}
            className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
              selectedView === 'categories'
                ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            By Categories
          </motion.button>
        </div>
      </div>

      {/* Brand View */}
      {selectedView === 'brands' && (
        <>
          {brandChartData.length > 0 ? (
            <>
              {/* Brand Volatility Chart */}
              <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-sm text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Brand Volatility Overview
                </h4>
                <ResponsiveContainer width="100%" height={200} minHeight={200}>
                  <BarChart data={brandChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="brand"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.7)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.7)' }}
                  label={{ value: 'Volatility Score', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 14, 39, 0.95)',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {brandChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.score >= 6
                          ? 'rgba(251, 113, 133, 0.7)'
                          : entry.score >= 4
                          ? 'rgba(251, 191, 36, 0.7)'
                          : entry.score >= 2.5
                          ? 'rgba(59, 130, 246, 0.7)'
                          : 'rgba(16, 185, 129, 0.7)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

              {/* Brand Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(data.volatility_metrics).map(([brand, metrics], idx) => (
              <motion.div
                key={brand}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className={`p-6 rounded-xl border ${getVolatilityColor(metrics.brand_volatility_score)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-light text-white/90 mb-2">{brand}</h4>
                    <span className="text-xs px-3 py-1 rounded-full border uppercase tracking-wider">
                      {getVolatilityLabel(metrics.brand_volatility_score)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extralight text-white/95">
                      {metrics.brand_volatility_score}
                    </div>
                    <div className="text-xs text-white/50 tracking-wider">SCORE</div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-black/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    {metrics.brand_volatility_score < 3 ? (
                      <TrendingDown className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-xs text-white/70 font-light">{metrics.trend}</p>
                  </div>
                </div>

                {/* Products */}
                <div className="space-y-2">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    Products ({metrics.products.length})
                  </div>
                  {metrics.products.map((product, pIdx) => (
                    <div key={pIdx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm text-white/90 font-light mb-1">
                            {product.product}
                          </div>
                          <div className="text-xs text-white/50">{product.asin}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-light text-white/90">{product.volatility}</div>
                          <div className="text-xs text-white/50">score</div>
                        </div>
                      </div>
                      <div className="text-xs text-white/60 mt-2 p-2 bg-black/20 rounded">
                        {product.rank_change}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60 text-sm">
                브랜드별 변동성 데이터가 없습니다.
              </p>
            </div>
          )}
        </>
      )}

      {/* Category View */}
      {selectedView === 'categories' && (
        <>
          {categoryChartData.length > 0 ? (
            <>
              {/* Category Volatility Chart */}
              <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-sm text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Category Volatility Overview
                </h4>
                <ResponsiveContainer width="100%" height={250} minHeight={250}>
                  <BarChart data={categoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  type="number"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.7)' }}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '11px', fill: 'rgba(255,255,255,0.7)' }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 14, 39, 0.95)',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.score >= 6
                          ? 'rgba(251, 113, 133, 0.7)'
                          : entry.score >= 4
                          ? 'rgba(251, 191, 36, 0.7)'
                          : entry.score >= 2.5
                          ? 'rgba(59, 130, 246, 0.7)'
                          : 'rgba(16, 185, 129, 0.7)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

              {/* Category Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(data.category_volatility).map(([category, metrics], idx) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className={`p-5 rounded-xl border ${getVolatilityColor(metrics.score)}`}
              >
                <div className="text-center mb-4">
                  <div className="text-4xl font-extralight text-white/95 mb-1">
                    {metrics.score}
                  </div>
                  <div className="text-sm text-white/90 font-light mb-2">
                    {category.replace(/_/g, ' ')}
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full border uppercase tracking-wider">
                    {getVolatilityLabel(metrics.score)}
                  </span>
                </div>
                <div className="p-3 bg-black/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/70 font-light">{metrics.trend}</p>
                  </div>
                </div>
              </motion.div>
            ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60 text-sm">
                카테고리별 변동성 데이터가 없습니다.
              </p>
            </div>
          )}
        </>
      )}

      {/* Insights Section */}
      {data.insights && data.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <h4 className="text-sm text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Key Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + idx * 0.1 }}
                className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/30"
              >
                <div className="text-sm text-white/90 font-medium mb-3">{insight.finding}</div>
                <div className="text-xs text-purple-300/80 p-3 bg-black/20 rounded">
                  <span className="text-purple-300 font-medium">Implication:</span> {insight.implication}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
};
