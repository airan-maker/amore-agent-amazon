import { motion } from 'framer-motion';
import { useState } from 'react';
import { GlassCard, MetricDisplay } from './GlassCard';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Import product details to check availability
import productDetailsData from '../data/product_details.json';

export const BreadcrumbMapping = ({ data, onProductClick }) => {
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);

  if (!data || !data.products) return null;

  const currentProduct = data.products[selectedProductIndex];

  const chartData = currentProduct.exposure_paths.map(path => ({
    category: path.breadcrumb.split(' > ').pop(),
    traffic: path.traffic_percentage,
    conversion: path.conversion_rate,
    isGap: path.gap_detected || false,
  }));

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <GlassCard delay={0.2} className="p-8">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase mb-4">
            Real Exposure Breadcrumb Mapping
          </h3>

          {/* Product Selector */}
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-white/50 uppercase tracking-wider">Select Product:</span>
            <span className="text-xs text-purple-300/60 italic ml-2">(더블클릭으로 상세 정보 보기)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.products.map((product, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedProductIndex(idx)}
                onDoubleClick={() => onProductClick && onProductClick(product.brand, product.product, product.asin)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-light transition-all
                  ${selectedProductIndex === idx
                    ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/50 text-white'
                    : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:border-purple-400/30'
                  }
                `}
                title="더블클릭하여 상세 정보 보기"
              >
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    {product.brand}
                    {product.asin && productDetailsData[product.asin] && (
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="상세 정보 있음" />
                    )}
                  </div>
                  <div className="text-xs opacity-70">{product.product}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/40 tracking-wider mb-1">Registered Category</div>
          <div className="text-sm text-white/70 font-light">{currentProduct.registered_category}</div>
        </div>
      </div>

      {currentProduct.exposure_paths.some(p => p.gap_detected) && (
        <div className="mb-8 p-4 bg-purple-500/10 border border-purple-400/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-white/70 font-light leading-relaxed">
                <span className="text-amber-400 font-medium">Gap Detected:</span> 명목 카테고리는 '{currentProduct.registered_category}'이나,
                실제 트래픽의 <span className="text-white font-medium">{currentProduct.exposure_paths.find(p => p.gap_detected)?.traffic_percentage}%</span>가
                '{currentProduct.exposure_paths.find(p => p.gap_detected)?.breadcrumb.split(' > ').pop()}' 에서 발생
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="category"
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.7)' }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.7)' }}
              label={{ value: 'Traffic %', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 14, 39, 0.95)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
              itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
            />
            <Bar dataKey="traffic" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isGap ? 'rgba(251, 191, 36, 0.7)' : 'rgba(147, 51, 234, 0.6)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {currentProduct.exposure_paths.map((path, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className={`p-4 rounded-xl border ${
              path.gap_detected
                ? 'bg-amber-500/5 border-amber-400/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm text-white/50 mb-1">
                  {path.breadcrumb}
                </p>
                {path.gap_detected && (
                  <p className="text-xs text-amber-400/80 mt-2">
                    {path.gap_insight}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(path.trend)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <MetricDisplay
                label="Traffic"
                value={`${path.traffic_percentage}%`}
                className="text-center"
              />
              <MetricDisplay
                label="Avg Rank"
                value={path.avg_rank}
                className="text-center"
              />
              <MetricDisplay
                label="CVR"
                value={`${path.conversion_rate}%`}
                className="text-center"
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        key={`recommendation-${selectedProductIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-400/20"
      >
        <p className="text-white/70 font-light text-sm leading-relaxed">
          <span className="text-purple-300 font-medium">전략 제안:</span> {currentProduct.strategic_recommendation}
        </p>
      </motion.div>
    </GlassCard>
  );
};
