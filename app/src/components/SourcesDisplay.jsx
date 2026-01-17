/**
 * Sources Display Component
 * Shows the sources/references used to generate an answer
 */

export const SourcesDisplay = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
      <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <span className="text-lg">📚</span>
        참고한 데이터 출처
      </h4>
      <ul className="space-y-2">
        {sources.map((source, idx) => {
          const relevancePercent = (parseFloat(source.relevance) * 100).toFixed(0);
          const isHighRelevance = relevancePercent >= 80;

          return (
            <li
              key={idx}
              className="text-xs text-blue-800 flex items-start gap-2 p-2 bg-white/60 rounded-lg"
            >
              <span className="font-bold text-blue-600 min-w-[20px]">
                {idx + 1}.
              </span>
              <div className="flex-1">
                <div className="font-medium text-blue-900">
                  {source.product}
                  {source.brand && source.brand !== 'Unknown' && (
                    <span className="text-blue-600 ml-1">by {source.brand}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                    {source.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      isHighRelevance
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {relevancePercent}% 관련도
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {sources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-[10px] text-blue-600 italic">
            ✨ RAG (Retrieval-Augmented Generation) 시스템을 통해 생성된 답변입니다
          </p>
        </div>
      )}
    </div>
  );
};
