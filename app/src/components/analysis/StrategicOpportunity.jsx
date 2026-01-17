import { Lightbulb, AlertCircle } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { calculateStrategicGaps } from '../../utils/productAnalysis';

export const StrategicOpportunity = ({ products, productDetails }) => {
  if (!products || products.length === 0) return null;

  const gaps = calculateStrategicGaps(products);

  // Categorize gaps by opportunity level
  const veryHighGaps = gaps.filter(g => g.opportunity === 'very high');
  const highGaps = gaps.filter(g => g.opportunity === 'high');

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-500/10">
          <Lightbulb className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-light text-white/90">Strategic Opportunity</h3>
          <p className="text-white/50 text-sm">미충족 수요 및 차별화 기회 식별</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg p-4 border border-red-400/20">
            <div className="text-red-300 text-sm mb-1">🔥 초고기회 영역</div>
            <div className="text-3xl font-light text-white/95 mb-1">{veryHighGaps.length}</div>
            <div className="text-white/60 text-xs">시장 커버리지 &lt; 5%</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-lg p-4 border border-orange-400/20">
            <div className="text-orange-300 text-sm mb-1">⚡ 고기회 영역</div>
            <div className="text-3xl font-light text-white/95 mb-1">{highGaps.length}</div>
            <div className="text-white/60 text-xs">시장 커버리지 5-15%</div>
          </div>
        </div>

        {/* Very High Opportunity Gaps */}
        {veryHighGaps.length > 0 && (
          <div>
            <h4 className="text-white/80 font-light mb-3 flex items-center gap-2">
              <span>🔥 초고기회 영역 (시장 커버리지 &lt; 5%)</span>
            </h4>
            <div className="space-y-3">
              {veryHighGaps.map((gap, idx) => (
                <div key={idx} className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg p-4 border border-red-400/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white/90 font-medium capitalize">{gap.keyword}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-300 text-sm font-medium">{gap.percentage}%</span>
                          <span className="text-white/50 text-xs">({gap.count}/{products.length})</span>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full"
                          style={{ width: `${Math.max(gap.percentage, 2)}%` }}
                        />
                      </div>
                      <div className="text-white/70 text-sm">
                        {gap.type === 'value' && (
                          <p>
                            <strong className="text-red-200">미충족 수요:</strong> "{gap.keyword}"을 강조하는 제품이
                            전체의 {gap.percentage}%에 불과합니다. 이 가치를 제품에 구현하고 마케팅 메시지로 활용하면
                            차별화된 포지셔닝이 가능합니다.
                          </p>
                        )}
                        {gap.type === 'effect' && (
                          <p>
                            <strong className="text-red-200">효과 격차:</strong> "{gap.keyword}" 효과를 제공하는 제품이
                            매우 부족합니다({gap.percentage}%). 이 효과를 구현하면 블루오션 시장을 선점할 수 있습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High Opportunity Gaps */}
        {highGaps.length > 0 && (
          <div>
            <h4 className="text-white/80 font-light mb-3 flex items-center gap-2">
              <span>⚡ 고기회 영역 (시장 커버리지 5-15%)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highGaps.map((gap, idx) => (
                <div key={idx} className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white/90 font-medium text-sm capitalize">{gap.keyword}</div>
                    <div className="text-orange-300 text-sm font-medium">{gap.percentage}%</div>
                  </div>
                  <div className="bg-white/5 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full rounded-full"
                      style={{ width: `${gap.percentage}%` }}
                    />
                  </div>
                  <div className="text-white/60 text-xs">
                    {gap.count}개 제품만 활용 중
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Gaps Found */}
        {gaps.length === 0 && (
          <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/20">
            <div className="text-green-300 text-sm font-medium mb-2">✅ 시장 포화 상태</div>
            <div className="text-white/70 text-sm">
              주요 키워드들이 대부분 시장에서 충분히 활용되고 있어 명확한 격차가 발견되지 않았습니다.
              더 세밀한 니치 시장 분석이 필요할 수 있습니다.
            </div>
          </div>
        )}

        {/* Strategic Recommendations */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-400/20">
          <div className="text-purple-300 text-sm font-medium mb-3">🎯 LANEIGE 차별화 전략</div>
          <div className="space-y-3">
            {veryHighGaps.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/90 font-medium text-sm mb-2">1. 블루오션 공략</div>
                <div className="text-white/70 text-sm">
                  <strong className="text-purple-200">
                    {veryHighGaps.slice(0, 3).map(g => g.keyword).join(', ')}
                  </strong> 키워드를 제품 개발 및 마케팅의 핵심으로 삼으세요.
                  경쟁이 적은 만큼 선점 효과가 큽니다.
                </div>
              </div>
            )}

            {highGaps.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/90 font-medium text-sm mb-2">2. 니치 마켓 공략</div>
                <div className="text-white/70 text-sm">
                  <strong className="text-purple-200">
                    {highGaps.slice(0, 3).map(g => g.keyword).join(', ')}
                  </strong> 영역은 일부 제품만 다루고 있어
                  전문화된 포지셔닝으로 충성 고객층을 확보할 수 있습니다.
                </div>
              </div>
            )}

            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/90 font-medium text-sm mb-2">3. 다중 키워드 전략</div>
              <div className="text-white/70 text-sm">
                2개 이상의 미충족 키워드를 결합한 제품(예: "Sensitive-Skin + Oil-Control + Vegan")을 개발하면
                독보적인 포지션을 확보할 수 있습니다.
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/90 font-medium text-sm mb-2">4. 제품명 최적화</div>
              <div className="text-white/70 text-sm">
                발견된 기회 키워드를 제품명에 명시적으로 포함하여 검색 최적화(SEO)와
                차별화된 메시지를 동시에 달성하세요.
              </div>
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
          <div className="text-blue-300 text-sm font-medium mb-3">📋 즉시 실행 플랜</div>
          <ol className="space-y-2 text-white/70 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-medium">1.</span>
              <span>
                <strong className="text-blue-200">단기(1-3개월):</strong> 기존 제품의 제품명과 설명에 기회 키워드 추가
                (예: "Sensitive Skin Friendly", "Oil-Control Formula")
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-medium">2.</span>
              <span>
                <strong className="text-blue-200">중기(3-6개월):</strong> 초고기회 영역 키워드를 타겟으로 한
                라인 확장 또는 리뉴얼 제품 개발
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-medium">3.</span>
              <span>
                <strong className="text-blue-200">장기(6-12개월):</strong> 다중 키워드 전략 기반의
                차별화된 프리미엄 라인 런칭
              </span>
            </li>
          </ol>
        </div>
      </div>
    </GlassCard>
  );
};
