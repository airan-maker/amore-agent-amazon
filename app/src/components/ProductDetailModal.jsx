import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Package, Sparkles, ThumbsUp, ThumbsDown, DollarSign, ExternalLink, TrendingUp, Loader } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { GlassCard } from './GlassCard';
import { getProductRankingHistory, getAvailableDates, formatDate } from '../utils/loadHistoricalData';
import { analyzeProductTrends } from '../utils/claudeAPI';

export const ProductDetailModal = ({ product, onClose, historicalData, category }) => {
  const [rankingHistory, setRankingHistory] = useState([]);
  const [dateRange, setDateRange] = useState('');
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  // Debug log
  console.log('ProductDetailModal rendering with product:', product);
  console.log('Historical data available:', historicalData ? Object.keys(historicalData).length : 0, 'dates');

  // Safety check - ensure product exists
  if (!product) {
    console.error('ProductDetailModal: product is null or undefined');
    return null;
  }

  // Load ranking history from real collected data
  useEffect(() => {
    if (!historicalData || !category) {
      console.warn('Missing historicalData or category:', { hasHistoricalData: !!historicalData, category });
      return;
    }

    const asin = product.basic_info?.asin || product.analysis?.asin;
    if (!asin) {
      console.warn('Missing ASIN for product');
      return;
    }

    console.log('Loading ranking history for:', { asin, category });

    // Get ranking history from real collected data
    const history = getProductRankingHistory(historicalData, asin, category);
    console.log('Ranking history loaded:', history.length, 'data points');
    setRankingHistory(history);

    // Calculate date range from available data
    if (history.length > 0) {
      const dates = getAvailableDates(historicalData);
      if (dates.length > 0) {
        const startDate = dates[dates.length - 1]; // Oldest date
        const endDate = dates[0]; // Most recent date
        setDateRange(`${formatDate(startDate)} - ${formatDate(endDate)}`);
      }
    }
  }, [product, historicalData, category]);

  // Handle AI analysis
  const handleAIAnalysis = async () => {
    if (rankingHistory.length < 2) return;

    setLoadingInsights(true);
    setShowAIAnalysis(true);

    const productName = product.analysis?.product_name || product.basic_info?.product_name || 'Unknown';
    const brand = product.basic_info?.brand || 'Unknown';

    // Prepare competitor context
    const competitorContext = {
      category,
      currentRating: product.analysis?.rating || product.basic_info?.rating,
      reviewCount: product.basic_info?.review_count,
      categoryAvgRank: 50, // Placeholder
      brandProductsInTop100: 5, // Placeholder
      topCompetitors: ['CeraVe', 'Neutrogena', 'La Roche-Posay'] // Placeholder
    };

    try {
      const insights = await analyzeProductTrends({
        productName,
        brand,
        rankingHistory,
        competitorContext
      });
      setAiInsights(insights);
    } catch (err) {
      console.error('Error loading AI insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Helper function to safely render any value
  const safeRender = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      // If it's an object, try to format it nicely
      return Object.entries(value)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
    }
    return String(value);
  };

  try {
    const analysis = product?.analysis || {};
    const detailedInfo = product?.detailed_info || {};
    const basicInfo = product?.basic_info || {};

    const priceSpecs = analysis.price_and_specs || {};
    const keyFeatures = analysis.key_features || {};
    const reviewSummary = analysis.review_summary || {};

    // Construct Amazon URL
    const getAmazonUrl = () => {
      const productUrl = basicInfo.product_url || detailedInfo.product_url;
      if (!productUrl) return null;

      // If relative URL, add Amazon base URL
      if (productUrl.startsWith('/')) {
        return `https://www.amazon.com${productUrl}`;
      }
      return productUrl;
    };

    const amazonUrl = getAmazonUrl();

    // Get product name from various sources
    const productName = analysis.product_name || basicInfo.product_name || detailedInfo.product_name || 'Product Details';

    console.log('Modal rendering with:', { productName, hasAnalysis: !!analysis, hasDetailedInfo: !!detailedInfo });

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard className="overflow-y-auto max-h-[90vh] p-8 border-0">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Product Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-light text-white/95 mb-2 pr-12">
                {productName}
              </h2>

              {/* Rating and Price */}
              <div className="flex items-center gap-6 flex-wrap">
                {analysis.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white/90 font-medium">{safeRender(analysis.rating)}</span>
                    <span className="text-white/50 text-sm">/ 5.0</span>
                  </div>
                )}

                {priceSpecs.price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-white/90 font-medium">{safeRender(priceSpecs.price)}</span>
                    {priceSpecs.size && (
                      <span className="text-white/50 text-sm">({safeRender(priceSpecs.size)})</span>
                    )}
                  </div>
                )}

                {/* Amazon Link Button */}
                {amazonUrl && (
                  <a
                    href={amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-400/30 hover:from-orange-500/30 hover:to-orange-600/30 hover:border-orange-400/50 transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4 text-orange-300" />
                    <span className="text-orange-200 text-sm font-medium">Amazon에서 보기</span>
                  </a>
                )}
              </div>
            </div>

            {/* Product Images */}
            {Array.isArray(detailedInfo.images) && detailedInfo.images.length > 0 && (
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                {detailedInfo.images.slice(0, 4).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Product ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-white/10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>
            )}

            {/* Key Features */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-light text-white/90">주요 특징 및 장점</h3>
              </div>

              <div className="space-y-3">
                {keyFeatures.formula && keyFeatures.formula !== "Not specified" && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-purple-300 text-sm font-medium mb-1">Formula</div>
                    <div className="text-white/80 text-sm">{safeRender(keyFeatures.formula)}</div>
                  </div>
                )}

                {keyFeatures.ingredients && keyFeatures.ingredients !== "Not specified" && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-blue-300 text-sm font-medium mb-1">Key Ingredients</div>
                    <div className="text-white/80 text-sm">{safeRender(keyFeatures.ingredients)}</div>
                  </div>
                )}

                {keyFeatures.scent && keyFeatures.scent !== "Not specified" && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-pink-300 text-sm font-medium mb-1">Scent</div>
                    <div className="text-white/80 text-sm">{safeRender(keyFeatures.scent)}</div>
                  </div>
                )}

                {keyFeatures.benefits && keyFeatures.benefits !== "Not specified" && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-green-300 text-sm font-medium mb-1">Benefits</div>
                    <div className="text-white/80 text-sm">{safeRender(keyFeatures.benefits)}</div>
                  </div>
                )}

                {keyFeatures.special_features && keyFeatures.special_features !== "Not specified" && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-yellow-300 text-sm font-medium mb-1">Special Features</div>
                    <div className="text-white/80 text-sm">{safeRender(keyFeatures.special_features)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Ranking History Chart */}
            {rankingHistory.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-light text-white/90">
                      Ranking Trend {dateRange && `(${dateRange})`}
                    </h3>
                  </div>

                  {!showAIAnalysis && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAIAnalysis}
                      disabled={loadingInsights}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>AI Analysis</span>
                    </motion.button>
                  )}
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={rankingHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '10px' }}
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        reversed={true}
                        domain={[1, 100]}
                        style={{ fontSize: '10px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          padding: '8px'
                        }}
                        labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                        itemStyle={{ color: 'rgba(147, 197, 253, 1)' }}
                        formatter={(value) => [`Rank #${value}`, '']}
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="rank"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={{ fill: '#60a5fa', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-white/50">시작: </span>
                      <span className="text-white/90">#{rankingHistory[0].rank}</span>
                    </div>
                    <div>
                      <span className="text-white/50">현재: </span>
                      <span className="text-white/90">#{rankingHistory[rankingHistory.length - 1].rank}</span>
                    </div>
                    <div>
                      <span className="text-white/50">변화: </span>
                      <span className={`font-medium ${rankingHistory[0].rank > rankingHistory[rankingHistory.length - 1].rank
                        ? 'text-red-400'
                        : rankingHistory[0].rank < rankingHistory[rankingHistory.length - 1].rank
                          ? 'text-green-400'
                          : 'text-white/70'
                        }`}>
                        {rankingHistory[0].rank > rankingHistory[rankingHistory.length - 1].rank
                          ? `↓${rankingHistory[rankingHistory.length - 1].rank - rankingHistory[0].rank}`
                          : rankingHistory[0].rank < rankingHistory[rankingHistory.length - 1].rank
                            ? `↑${rankingHistory[0].rank - rankingHistory[rankingHistory.length - 1].rank}`
                            : '→ 0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Product Insights */}
            {showAIAnalysis && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-light text-white/90">AI Ranking Analysis</h3>
                  {loadingInsights && (
                    <Loader className="w-4 h-4 text-purple-400 animate-spin" />
                  )}
                </div>

                {loadingInsights ? (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                    <div className="text-white/50 text-sm">랭킹 트렌드 분석 중...</div>
                  </div>
                ) : aiInsights ? (
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-400/20">
                    <div className="text-white/80 text-sm leading-relaxed prose prose-invert prose-sm max-w-none overflow-x-auto
                      prose-headings:text-white/90 prose-headings:font-medium prose-headings:mb-2
                      prose-p:text-white/80 prose-p:leading-relaxed
                      prose-strong:text-purple-300 prose-strong:font-medium
                      prose-ul:text-white/80 prose-li:text-white/80
                      prose-code:text-purple-300 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-table:border-collapse prose-table:w-full prose-table:text-sm
                      prose-thead:border-b prose-thead:border-white/20
                      prose-th:text-left prose-th:py-2 prose-th:px-3 prose-th:text-purple-300 prose-th:font-medium prose-th:bg-white/5
                      prose-td:py-2 prose-td:px-3 prose-td:border-t prose-td:border-white/10 prose-td:text-white/80
                      prose-tr:border-b prose-tr:border-white/10
                      prose-tbody:divide-y prose-tbody:divide-white/10">
                      <ReactMarkdown>{aiInsights}</ReactMarkdown>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Review Summary */}
            {reviewSummary && (reviewSummary.positive || reviewSummary.negative) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-light text-white/90">고객 리뷰 분석</h3>
                </div>

                {/* Overall Sentiment */}
                {reviewSummary.overall_sentiment && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-400/20 mb-4">
                    <div className="text-white/90 text-sm italic">
                      "{reviewSummary.overall_sentiment}"
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Positive Reviews */}
                  {reviewSummary.positive && reviewSummary.positive.length > 0 && (
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/20">
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                        <div className="text-green-300 font-medium text-sm">긍정적 리뷰</div>
                      </div>
                      <ul className="space-y-2 text-white/80 text-sm">
                        {Array.isArray(reviewSummary.positive) ? (
                          reviewSummary.positive.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-400 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>{reviewSummary.positive}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Negative Reviews */}
                  {reviewSummary.negative && reviewSummary.negative.length > 0 && (
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-400/20">
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                        <div className="text-red-300 font-medium text-sm">부정적 리뷰 및 개선점</div>
                      </div>
                      <ul className="space-y-2 text-white/80 text-sm">
                        {Array.isArray(reviewSummary.negative) ? (
                          reviewSummary.negative.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-red-400 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-1">•</span>
                            <span>{reviewSummary.negative}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error or No Data */}
            {product.error && (
              <div className="bg-red-500/10 rounded-lg p-4 border border-red-400/20">
                <div className="text-red-300 text-sm">
                  상세 정보를 불러올 수 없습니다: {product.error}
                </div>
              </div>
            )}

            {!analysis.product_name && !product.error && (
              <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-400/20">
                <div className="text-yellow-300 text-sm">
                  이 제품의 상세 분석이 아직 준비되지 않았습니다.
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    );
  } catch (error) {
    console.error('Error rendering ProductDetailModal:', error);
    // Fallback UI if rendering fails
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard className="p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="bg-red-500/10 rounded-lg p-6 border border-red-400/20">
              <h3 className="text-xl text-red-300 mb-2">오류 발생</h3>
              <p className="text-white/70 text-sm mb-4">
                제품 상세 정보를 표시하는 중 오류가 발생했습니다.
              </p>
              <p className="text-white/50 text-xs font-mono">
                {error.message}
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    );
  }
};
