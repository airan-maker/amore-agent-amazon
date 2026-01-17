import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { analyzeKeywordFrequency } from '../../utils/productAnalysis';

export const USPClustering = ({ products }) => {
  if (!products || products.length === 0) return null;

  const frequency = analyzeKeywordFrequency(products);

  // Convert to chart data
  const formulaData = Object.entries(frequency.formula)
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: ((count / products.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const effectsData = Object.entries(frequency.effects)
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: ((count / products.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const valuesData = Object.entries(frequency.values)
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: ((count / products.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-white/20 rounded-lg p-3 backdrop-blur-xl">
          <p className="text-white/90 font-medium capitalize">{payload[0].payload.keyword}</p>
          <p className="text-purple-300">{payload[0].value} products</p>
          <p className="text-white/60 text-sm">{payload[0].payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Find dominant trends
  const topEffect = effectsData[0];
  const topValue = valuesData[0];

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Package className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-light text-white/90">핵심 소구점(USP) 클러스터링</h3>
          <p className="text-white/50 text-sm">제품명 키워드 분석 - 제형, 효과, 가치 중심</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Trend Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-400/20">
            <div className="text-purple-300 text-sm font-medium mb-1">🔥 지배적 효과</div>
            {topEffect && (
              <>
                <div className="text-2xl font-light text-white/90 capitalize mb-1">{topEffect.keyword}</div>
                <div className="text-white/60 text-sm">
                  전체 제품의 {topEffect.percentage}% ({topEffect.count}개)가 강조
                </div>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg p-4 border border-green-400/20">
            <div className="text-green-300 text-sm font-medium mb-1">✨ 핵심 가치</div>
            {topValue && (
              <>
                <div className="text-2xl font-light text-white/90 capitalize mb-1">{topValue.keyword}</div>
                <div className="text-white/60 text-sm">
                  {topValue.count}개 제품이 차별화 포인트로 활용 ({topValue.percentage}%)
                </div>
              </>
            )}
          </div>
        </div>

        {/* Effects Chart */}
        {effectsData.length > 0 && (
          <div>
            <h4 className="text-white/80 font-light mb-3">효과 키워드 (Effects)</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={effectsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="keyword"
                    tick={{ fill: '#ffffff80', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: '#ffffff80', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Values Chart */}
        {valuesData.length > 0 && (
          <div>
            <h4 className="text-white/80 font-light mb-3">가치/성분 키워드 (Values)</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valuesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="keyword"
                    tick={{ fill: '#ffffff80', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: '#ffffff80', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Formula Keywords (Simple List) */}
        {formulaData.length > 0 && (
          <div>
            <h4 className="text-white/80 font-light mb-3">제형 키워드 (Formula)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formulaData.map(({ keyword, count, percentage }) => (
                <div key={keyword} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-blue-300 text-sm capitalize mb-1">{keyword}</div>
                  <div className="text-white/90 font-medium">{count}개</div>
                  <div className="text-white/50 text-xs">{percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Insight */}
        <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-400/20">
          <div className="text-yellow-300 text-sm font-medium mb-2">💡 전략적 인사이트</div>
          <div className="text-white/70 text-sm space-y-2">
            {topEffect && topEffect.percentage > 20 && (
              <p>
                • <strong className="text-yellow-200">"{topEffect.keyword}"</strong> 효과는 이 카테고리의 필수 조건으로 자리잡았습니다.
                상위권 진입을 위해서는 이 특징을 반드시 구현해야 합니다.
              </p>
            )}
            {topValue && topValue.percentage > 15 && (
              <p>
                • <strong className="text-yellow-200">"{topValue.keyword}"</strong> 가치는 소비자들이 중요하게 생각하는 차별화 포인트입니다.
                브랜드 메시지에 적극 활용하세요.
              </p>
            )}
            {effectsData.length >= 3 && (
              <p>
                • 상위 3개 효과 키워드({effectsData.slice(0, 3).map(d => d.keyword).join(', ')})가
                시장을 지배하고 있습니다. 이 중 2개 이상을 결합한 제품이 경쟁력을 가집니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
