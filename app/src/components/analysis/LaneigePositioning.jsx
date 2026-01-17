import { Target, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { analyzeLaneigePositioning } from '../../utils/productAnalysis';

export const LaneigePositioning = ({ products, productDetails }) => {
  if (!products || products.length === 0) return null;

  const analysis = analyzeLaneigePositioning(products, productDetails);

  if (!analysis) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Target className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-light text-white/90">LANEIGE vs Market</h3>
            <p className="text-white/50 text-sm">이 카테고리에는 LANEIGE 제품이 없습니다.</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const { laneigeProducts, metrics, comparison, insights } = analysis;

  const getRatingTrend = (gap) => {
    if (gap > 0.1) return { icon: TrendingUp, color: 'text-green-400', label: '우수' };
    if (gap < -0.1) return { icon: TrendingDown, color: 'text-red-400', label: '개선 필요' };
    return { icon: TrendingUp, color: 'text-yellow-400', label: '평균 수준' };
  };

  const getReviewTrend = (gap) => {
    if (gap > 0) return { icon: TrendingUp, color: 'text-green-400', label: '우수' };
    if (gap < -20) return { icon: TrendingDown, color: 'text-red-400', label: '부족' };
    return { icon: TrendingUp, color: 'text-yellow-400', label: '보통' };
  };

  const ratingTrend = getRatingTrend(parseFloat(comparison.category.ratingGap));
  const reviewTrend = getReviewTrend(parseFloat(comparison.category.reviewGap));

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-pink-500/10">
          <Target className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h3 className="text-lg font-light text-white/90">LANEIGE vs Market</h3>
          <p className="text-white/50 text-sm">전략적 포지셔닝 분석</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg p-4 border border-pink-400/20">
            <div className="text-pink-300 text-sm mb-1">리스팅 비중</div>
            <div className="text-3xl font-light text-white/95 mb-1">{metrics.listingShare}%</div>
            <div className="text-white/60 text-xs">
              상위 100개 중 {laneigeProducts.length}개 제품
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-400/20">
            <div className="flex items-center justify-between mb-1">
              <div className="text-yellow-300 text-sm">평균 평점</div>
              <ratingTrend.icon className={`w-4 h-4 ${ratingTrend.color}`} />
            </div>
            <div className="text-3xl font-light text-white/95 mb-1">⭐ {metrics.rating}</div>
            <div className="text-white/60 text-xs">
              카테고리 평균: {comparison.category.avgRating}
              <span className={parseFloat(comparison.category.ratingGap) < 0 ? 'text-red-300' : 'text-green-300'}>
                {' '}({comparison.category.ratingGap > 0 ? '+' : ''}{comparison.category.ratingGap})
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-400/20">
            <div className="flex items-center justify-between mb-1">
              <div className="text-blue-300 text-sm">평균 리뷰 수</div>
              <reviewTrend.icon className={`w-4 h-4 ${reviewTrend.color}`} />
            </div>
            <div className="text-3xl font-light text-white/95 mb-1">{metrics.reviews.toLocaleString()}</div>
            <div className="text-white/60 text-xs">
              카테고리 평균: {comparison.category.avgReviews.toLocaleString()}
              <span className={parseFloat(comparison.category.reviewGap) < 0 ? 'text-red-300' : 'text-green-300'}>
                {' '}({comparison.category.reviewGap}%)
              </span>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div>
          <h4 className="text-white/80 font-light mb-3">상세 비교 분석</h4>
          <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left py-3 px-4 text-white/70 text-sm font-light">지표</th>
                  <th className="text-center py-3 px-4 text-pink-300 text-sm font-light">LANEIGE</th>
                  <th className="text-center py-3 px-4 text-white/70 text-sm font-light">카테고리 평균</th>
                  <th className="text-center py-3 px-4 text-purple-300 text-sm font-light">상위 20%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-3 px-4 text-white/80 text-sm">평균 평점</td>
                  <td className="text-center py-3 px-4 text-pink-200 font-medium">{metrics.rating}</td>
                  <td className="text-center py-3 px-4 text-white/60">{comparison.category.avgRating}</td>
                  <td className="text-center py-3 px-4 text-purple-200">{comparison.topPerformers.avgRating}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-white/80 text-sm">평균 리뷰 수</td>
                  <td className="text-center py-3 px-4 text-pink-200 font-medium">{metrics.reviews.toLocaleString()}</td>
                  <td className="text-center py-3 px-4 text-white/60">{comparison.category.avgReviews.toLocaleString()}</td>
                  <td className="text-center py-3 px-4 text-purple-200">{comparison.topPerformers.avgReviews.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-white/80 text-sm">평점 격차</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className={`text-center py-3 px-4 font-medium ${parseFloat(comparison.category.ratingGap) < 0 ? 'text-red-300' : 'text-green-300'}`}>
                    {comparison.category.ratingGap > 0 ? '+' : ''}{comparison.category.ratingGap}
                  </td>
                  <td className={`text-center py-3 px-4 font-medium ${parseFloat(comparison.topPerformers.ratingGap) < 0 ? 'text-red-300' : 'text-green-300'}`}>
                    {comparison.topPerformers.ratingGap > 0 ? '+' : ''}{comparison.topPerformers.ratingGap}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-white/80 text-sm">리뷰 수 격차</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className={`text-center py-3 px-4 font-medium ${parseFloat(comparison.category.reviewGap) < 0 ? 'text-red-300' : 'text-green-300'}`}>
                    {comparison.category.reviewGap}%
                  </td>
                  <td className={`text-center py-3 px-4 font-medium ${parseFloat(comparison.topPerformers.reviewGap) < 0 ? 'text-red-300' : 'text-green-300'}`}>
                    {comparison.topPerformers.reviewGap}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* LANEIGE Products */}
        <div>
          <h4 className="text-white/80 font-light mb-3">LANEIGE 제품 목록</h4>
          <div className="space-y-2">
            {laneigeProducts.map((product, idx) => (
              <div key={idx} className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg p-3 border border-pink-400/20">
                <div className="font-medium text-white/90 text-sm mb-1">{product.product_name}</div>
                <div className="flex gap-4 text-xs">
                  <span className="text-yellow-300">⭐ {product.rating}</span>
                  <span className="text-blue-300">{product.review_count?.toLocaleString()} reviews</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Insights */}
        {insights.length > 0 && (
          <div>
            <h4 className="text-white/80 font-light mb-3">전략적 제언</h4>
            <div className="space-y-3">
              {insights.map((insight, idx) => {
                const bgColor = insight.type === 'critical' ? 'bg-red-500/10 border-red-400/30'
                  : insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-400/30'
                  : 'bg-blue-500/10 border-blue-400/30';

                const iconColor = insight.type === 'critical' ? 'text-red-300'
                  : insight.type === 'warning' ? 'text-yellow-300'
                  : 'text-blue-300';

                return (
                  <div key={idx} className={`rounded-lg p-4 border ${bgColor}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                      <div>
                        <div className={`font-medium text-sm mb-1 ${iconColor}`}>
                          {insight.type === 'critical' ? '🚨 긴급 개선 필요'
                            : insight.type === 'warning' ? '⚠️ 주의 필요'
                            : '💡 기회 포착'}
                        </div>
                        <div className="text-white/80 text-sm">{insight.message}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Items */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-400/20">
          <div className="text-purple-300 text-sm font-medium mb-3">📋 즉시 실행 가능한 액션</div>
          <ul className="space-y-2 text-white/70 text-sm">
            {parseFloat(comparison.category.ratingGap) < -0.1 && (
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">1.</span>
                <span>리뷰 텍스트 마이닝을 통해 부정 리뷰의 주요 원인 파악 (배송, 품질, 효과 등)</span>
              </li>
            )}
            {parseFloat(comparison.category.reviewGap) < -30 && (
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">2.</span>
                <span>구매 후 리뷰 작성 유도 캠페인 실시 (할인 쿠폰, 샘플 증정 등)</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">3.</span>
              <span>상위 20% 제품의 공통 특징 분석 및 벤치마킹</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">4.</span>
              <span>제품명에 핵심 USP 키워드 추가로 검색 최적화 (SEO)</span>
            </li>
          </ul>
        </div>
      </div>
    </GlassCard>
  );
};
