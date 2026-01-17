import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { GlassCard } from '../GlassCard';

const COLORS = [
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#6366f1', '#ef4444', '#14b8a6', '#f97316', '#a855f7'
];

export const MarketConcentration = ({ products }) => {
  if (!products || products.length === 0) return null;

  // Calculate brand concentration
  const brandCounts = {};
  products.forEach(product => {
    const brand = product.brand || 'Unknown';
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
  });

  const sortedBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1]);

  const top10 = sortedBrands.slice(0, 10);
  const top10Count = top10.reduce((sum, [, count]) => sum + count, 0);
  const otherCount = products.length - top10Count;

  const chartData = [
    ...top10.map(([brand, count]) => ({
      name: brand,
      value: count,
      percentage: ((count / products.length) * 100).toFixed(1)
    })),
    ...(otherCount > 0 ? [{
      name: 'Others',
      value: otherCount,
      percentage: ((otherCount / products.length) * 100).toFixed(1)
    }] : [])
  ];

  const concentration = ((top10Count / products.length) * 100).toFixed(1);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-white/20 rounded-lg p-3 backdrop-blur-xl">
          <p className="text-white/90 font-medium">{payload[0].name}</p>
          <p className="text-purple-300 text-sm">{payload[0].value} products</p>
          <p className="text-white/60 text-sm">{payload[0].payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <TrendingUp className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-light text-white/90">Market Concentration</h3>
          <p className="text-white/50 text-sm">상위 10개 브랜드 시장 집중도</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Others' ? '#9CA3AF' : COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2">
            {chartData.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.name === 'Others' ? '#9CA3AF' : COLORS[i % COLORS.length] }}
                  />
                  <span className="text-white/80">{entry.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white/60">{entry.value}개</span>
                  <span className="text-purple-300 font-medium min-w-[3.5rem] text-right">
                    {entry.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis */}
        <div className="space-y-4">
          {/* Key Metric */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-400/20">
            <div className="text-white/60 text-sm mb-1">시장 집중도</div>
            <div className="text-3xl font-light text-white/95 mb-2">{concentration}%</div>
            <div className="text-white/70 text-sm">
              상위 10개 브랜드가 전체 {products.length}개 제품 중 {top10Count}개 차지
            </div>
          </div>

          {/* Market Structure */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-white/70 text-sm mb-3 font-medium">시장 구조</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">상위 브랜드 (#1)</span>
                <span className="text-purple-300 font-medium">
                  {((top10[0][1] / products.length) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">상위 3개 브랜드</span>
                <span className="text-purple-300 font-medium">
                  {((top10.slice(0, 3).reduce((sum, [, count]) => sum + count, 0) / products.length) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">기타 브랜드</span>
                <span className="text-white/60 font-medium">
                  {((otherCount / products.length) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Insight */}
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
            <div className="text-blue-300 text-sm font-medium mb-2">💡 인사이트</div>
            <div className="text-white/70 text-sm">
              {concentration > 60
                ? '시장이 소수 브랜드에 집중되어 있어 신규 진입이 어려운 환경입니다. 차별화된 포지셔닝이 필수적입니다.'
                : concentration > 40
                ? '상위 브랜드의 영향력이 크지만, 중소 브랜드에게도 기회가 있는 시장입니다.'
                : '시장이 파편화되어 있어 다양한 브랜드가 경쟁하고 있습니다. 니치 시장 공략이 유리합니다.'}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
