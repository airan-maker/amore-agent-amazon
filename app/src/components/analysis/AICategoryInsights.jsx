import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Loader, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GlassCard } from '../GlassCard';
import { analyzeCategoryTrends as analyzeWithClaude } from '../../utils/claudeAPI';
import { analyzeCategoryTrends, formatDate } from '../../utils/generateHistoricalRankings';

export const AICategoryInsights = ({ category, historicalData, availableDates }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [startDate, setStartDate] = useState(availableDates[availableDates.length - 1] || '2025-01-01');
  const [endDate, setEndDate] = useState(availableDates[0] || '2025-11-30');

  const handleAnalyze = async () => {
    if (!category || !historicalData) return;

    setLoading(true);
    setError(null);

    try {
      // Analyze trends
      const trends = analyzeCategoryTrends(historicalData, category, startDate, endDate);

      if (!trends) {
        setError('Not enough data to analyze trends.');
        setLoading(false);
        return;
      }

      setTrendData(trends);

      // Filter and analyze LANEIGE products specifically
      const laneigeProducts = trends.allProducts?.filter(p =>
        p.brand?.toLowerCase().includes('laneige') ||
        p.product_name?.toLowerCase().includes('laneige')
      ) || [];

      const laneigeData = laneigeProducts.map(p => ({
        product_name: p.product_name,
        brand: p.brand,
        startRank: p.startRank,
        endRank: p.endRank,
        rankChange: p.rankChange,
        rating: p.rating,
        review_count: p.review_count
      }));

      // Get AI insights with LANEIGE-specific analysis
      const aiInsights = await analyzeWithClaude({
        category,
        trendData: trends,
        topMovers: trends.topMovers,
        laneigeProducts: laneigeData,
        dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`
      });

      setInsights(aiInsights);
    } catch (err) {
      console.error('Error loading AI insights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <GlassCard className="p-6 mb-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-light text-white/90">AI-Powered Ranking Insights</h3>
            <p className="text-white/50 text-sm">
              분석 기간을 선택하고 AI 분석을 실행하세요
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-white/60 text-sm mb-2">Start Date</label>
          <select
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 focus:border-purple-400/50 focus:outline-none transition-colors"
            disabled={loading}
          >
            {availableDates.slice().reverse().map(date => (
              <option key={date} value={date} className="bg-gray-900">
                {formatDate(date)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-white/60 text-sm mb-2">End Date</label>
          <select
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 focus:border-purple-400/50 focus:outline-none transition-colors"
            disabled={loading}
          >
            {availableDates.map(date => (
              <option key={date} value={date} className="bg-gray-900">
                {formatDate(date)}
              </option>
            ))}
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAnalyze}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>AI 분석 실행</span>
            </>
          )}
        </motion.button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {trendData && !loading && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-white/50 text-xs mb-1">Total Products</div>
              <div className="text-2xl font-light text-white/90">{trendData.totalProducts}</div>
            </div>

            <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/20">
              <div className="flex items-center gap-2 text-green-300 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>Improving</span>
              </div>
              <div className="text-2xl font-light text-green-300">{trendData.improvingCount}</div>
            </div>

            <div className="bg-red-500/10 rounded-lg p-4 border border-red-400/20">
              <div className="flex items-center gap-2 text-red-300 text-xs mb-1">
                <TrendingDown className="w-3 h-3" />
                <span>Declining</span>
              </div>
              <div className="text-2xl font-light text-red-300">{trendData.decliningCount}</div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-white/50 text-xs mb-1">Avg Volatility</div>
              <div className="text-2xl font-light text-white/90">
                {trendData.avgVolatility?.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Top Movers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Gainers */}
            <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg p-4 border border-green-400/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-medium text-green-300">Top Gaining Products</h4>
              </div>
              <div className="space-y-2">
                {trendData.topMovers.gainers.slice(0, 3).map((product, i) => (
                  <div key={i} className="text-xs">
                    <div className="text-white/80 mb-1 truncate">{product.product_name}</div>
                    <div className="flex items-center justify-between text-white/50">
                      <span className="text-[10px]">{product.brand}</span>
                      <span className="text-green-300">
                        #{product.startRank} → #{product.endRank} (↑{product.improvement})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-lg p-4 border border-red-400/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <h4 className="text-sm font-medium text-red-300">Top Declining Products</h4>
              </div>
              <div className="space-y-2">
                {trendData.topMovers.losers.slice(0, 3).map((product, i) => (
                  <div key={i} className="text-xs">
                    <div className="text-white/80 mb-1 truncate">{product.product_name}</div>
                    <div className="flex items-center justify-between text-white/50">
                      <span className="text-[10px]">{product.brand}</span>
                      <span className="text-red-300">
                        #{product.startRank} → #{product.endRank} (↓{product.decline})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LANEIGE Products Section */}
          {trendData.allProducts && (() => {
            const laneigeProducts = trendData.allProducts.filter(p =>
              p.brand?.toLowerCase().includes('laneige') ||
              p.product_name?.toLowerCase().includes('laneige')
            );

            if (laneigeProducts.length === 0) return null;

            return (
              <div className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-lg p-4 border border-pink-400/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <h4 className="text-sm font-medium text-pink-300">LANEIGE 제품 랭킹 변동</h4>
                  <span className="text-xs text-pink-300/60 ml-auto">{laneigeProducts.length}개 제품</span>
                </div>
                <div className="space-y-3">
                  {laneigeProducts.map((product, i) => {
                    const isImproving = product.rankChange > 0;
                    const isStable = product.rankChange === 0;

                    return (
                      <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-white/90 text-sm mb-2 font-medium">{product.product_name}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-white/50">시작: </span>
                            <span className="text-white/80">#{product.startRank}</span>
                          </div>
                          <div>
                            <span className="text-white/50">종료: </span>
                            <span className="text-white/80">#{product.endRank}</span>
                          </div>
                          <div>
                            <span className="text-white/50">변동: </span>
                            <span className={`font-medium ${
                              isImproving ? 'text-green-400' : isStable ? 'text-white/70' : 'text-red-400'
                            }`}>
                              {isImproving ? `↑${product.rankChange}` : isStable ? '→ 0' : `↓${Math.abs(product.rankChange)}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/50">평점: </span>
                            <span className="text-white/80">{product.rating} ({product.review_count?.toLocaleString()})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* AI Insights */}
          {insights && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-purple-400/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-purple-300">Claude's Analysis</h4>
              </div>
              <div className="text-white/80 text-sm prose prose-invert prose-sm max-w-none
                prose-headings:text-white/90 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm
                prose-p:text-white/80 prose-p:leading-relaxed prose-p:my-3
                prose-strong:text-purple-300 prose-strong:font-semibold
                prose-ul:my-3 prose-ul:space-y-2 prose-li:text-white/80 prose-li:my-1
                prose-ol:my-3 prose-ol:space-y-2
                prose-code:text-purple-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-blockquote:border-l-purple-400 prose-blockquote:text-white/70">
                <ReactMarkdown>{insights}</ReactMarkdown>

                {/* Separate container for tables with horizontal scroll */}
                <style jsx>{`
                  :global(.prose table) {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1.5rem 0;
                    font-size: 0.875rem;
                    display: table;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                  }
                  :global(.prose thead) {
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                  }
                  :global(.prose th) {
                    padding: 0.75rem 1rem;
                    text-align: left;
                    font-weight: 600;
                    color: rgb(192, 132, 252);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                  }
                  :global(.prose td) {
                    padding: 0.75rem 1rem;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.8);
                  }
                  :global(.prose tbody tr:hover) {
                    background: rgba(255, 255, 255, 0.03);
                  }
                  :global(.prose tr) {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                  }
                `}</style>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </GlassCard>
  );
};
