import { Sparkles, TrendingUp, Star } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { identifyRisingStars } from '../../utils/productAnalysis';

export const RisingStars = ({ products }) => {
  if (!products || products.length === 0) return null;

  const risingStars = identifyRisingStars(products, 5000);

  if (risingStars.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-light text-white/90">Rising Stars</h3>
            <p className="text-white/50 text-sm">리뷰 수 &lt; 5,000 && 평점 ≥ 4.5 && 상위 50위 내 제품</p>
          </div>
        </div>
        <div className="text-white/60 text-sm">
          현재 이 카테고리에는 Rising Star 조건을 만족하는 제품이 없습니다.
        </div>
      </GlassCard>
    );
  }

  // Analyze common keywords among rising stars
  const allKeywords = {
    formula: {},
    effects: {},
    values: {}
  };

  risingStars.forEach(product => {
    product.keywords.formula.forEach(kw => {
      allKeywords.formula[kw] = (allKeywords.formula[kw] || 0) + 1;
    });
    product.keywords.effects.forEach(kw => {
      allKeywords.effects[kw] = (allKeywords.effects[kw] || 0) + 1;
    });
    product.keywords.values.forEach(kw => {
      allKeywords.values[kw] = (allKeywords.values[kw] || 0) + 1;
    });
  });

  const topEffects = Object.entries(allKeywords.effects)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topValues = Object.entries(allKeywords.values)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-light text-white/90">Rising Stars</h3>
          <p className="text-white/50 text-sm">적은 리뷰로 상위권 진입한 떠오르는 제품</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-light text-yellow-300">{risingStars.length}</div>
          <div className="text-white/50 text-xs">발견됨</div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Selection Criteria */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-400/20">
          <div className="text-yellow-300 text-sm font-medium mb-2">🎯 선정 기준</div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-white/50 mb-1">리뷰 수</div>
              <div className="text-white/80 font-medium">&lt; 5,000개</div>
            </div>
            <div>
              <div className="text-white/50 mb-1">평점</div>
              <div className="text-white/80 font-medium">≥ 4.5점</div>
            </div>
            <div>
              <div className="text-white/50 mb-1">순위</div>
              <div className="text-white/80 font-medium">상위 50위 내</div>
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        {(topEffects.length > 0 || topValues.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topEffects.length > 0 && (
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-400/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <div className="text-purple-300 text-sm font-medium">부상 중인 효과</div>
                </div>
                <div className="space-y-2">
                  {topEffects.map(([keyword, count]) => (
                    <div key={keyword} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm capitalize">{keyword}</span>
                      <span className="text-purple-300 text-xs">{count}개 제품</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topValues.length > 0 && (
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/20">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-green-400" />
                  <div className="text-green-300 text-sm font-medium">주목받는 가치</div>
                </div>
                <div className="space-y-2">
                  {topValues.map(([keyword, count]) => (
                    <div key={keyword} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm capitalize">{keyword}</span>
                      <span className="text-green-300 text-xs">{count}개 제품</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rising Star Products */}
        <div>
          <h4 className="text-white/80 font-light mb-3">발견된 Rising Stars</h4>
          <div className="space-y-3">
            {risingStars.map((product, idx) => (
              <div key={product.asin} className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-lg p-4 border border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">#{product.rank}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Product Name */}
                    <div className="text-white/90 font-medium text-sm mb-2 line-clamp-2">
                      {product.product_name}
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 mb-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-300 font-medium">{product.rating}</span>
                      </div>
                      <div className="text-blue-300">
                        {product.review_count?.toLocaleString()} reviews
                      </div>
                      <div className="text-pink-300">
                        {product.brand}
                      </div>
                    </div>

                    {/* Keywords */}
                    {(product.keywords.effects.length > 0 || product.keywords.values.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {product.keywords.effects.slice(0, 3).map(kw => (
                          <span key={kw} className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-xs capitalize">
                            {kw}
                          </span>
                        ))}
                        {product.keywords.values.slice(0, 3).map(kw => (
                          <span key={kw} className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-200 text-xs capitalize">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Insight */}
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
          <div className="text-blue-300 text-sm font-medium mb-2">💡 트렌드 인사이트</div>
          <div className="text-white/70 text-sm space-y-2">
            <p>
              • 이 제품들은 <strong className="text-blue-200">적은 리뷰로도 높은 평점과 상위 순위</strong>를 달성하여
              현재 시장의 트렌드 변화를 반영하고 있습니다.
            </p>
            {topEffects.length > 0 && (
              <p>
                • <strong className="text-blue-200">"{topEffects[0][0]}"</strong> 효과가 신규 제품들 사이에서 부상하고 있으며,
                이는 소비자 니즈의 변화를 시사합니다.
              </p>
            )}
            {topValues.length > 0 && (
              <p>
                • <strong className="text-blue-200">"{topValues[0][0]}"</strong> 가치를 강조하는 제품들이 빠르게 성장하고 있어,
                이를 마케팅 메시지에 반영하는 것이 효과적입니다.
              </p>
            )}
            <p>
              • Rising Stars를 지속 모니터링하여 시장 트렌드를 선제적으로 파악하고 제품 개발에 반영하세요.
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
