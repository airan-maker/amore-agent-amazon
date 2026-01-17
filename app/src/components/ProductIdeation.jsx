import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Lightbulb, TrendingUp, Target, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

export const ProductIdeation = () => {
  const [ideationData, setIdeationData] = useState(null);
  const [attributeData, setAttributeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    // Load ideation report
    import('../data/product_ideation_report.json')
      .then(data => {
        console.log('Loaded ideation data:', data);
        setIdeationData(data.default || data);
      })
      .catch(err => {
        console.error('Failed to load ideation data:', err);
      });

    // Load attributes
    import('../data/product_attributes.json')
      .then(data => {
        console.log('Loaded attributes data:', data);
        setAttributeData(data.default || data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load attributes data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading product insights...</div>
      </div>
    );
  }

  if (!ideationData) {
    return (
      <GlassCard className="p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400/60" />
          <h3 className="text-xl font-semibold text-white mb-2">No Product Ideation Data</h3>
          <p className="text-white/60 mb-4">
            AI-powered product ideation data is not available yet.
          </p>
          <p className="text-sm text-white/40">
            Run the full pipeline with ANTHROPIC_API_KEY set to generate product ideas.
          </p>
        </div>
      </GlassCard>
    );
  }

  const metadata = ideationData.metadata || {};
  const categoryAnalyses = ideationData.category_analyses || {};
  const crossInsights = ideationData.cross_category_insights || {};

  const categories = Object.keys(categoryAnalyses);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {metadata.total_ideas_generated || 0}
              </div>
              <div className="text-sm text-white/60">Product Ideas</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {categories.length}
              </div>
              <div className="text-sm text-white/60">Categories Analyzed</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {attributeData?.metadata?.total_products || 0}
              </div>
              <div className="text-sm text-white/60">Products Analyzed</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                ${metadata.total_api_cost?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-white/60">API Cost</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Category Selection */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select Category</h3>
        <div className="grid grid-cols-2 gap-3">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`p-4 rounded-lg transition-all ${
                selectedCategory === category
                  ? 'bg-purple-500/30 border-2 border-purple-400'
                  : 'bg-white/5 border-2 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-white">{category}</div>
                <div className="text-sm text-white/60">
                  {categoryAnalyses[category]?.product_ideas?.length || 0} ideas
                </div>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Selected Category Details */}
      {selectedCategory && categoryAnalyses[selectedCategory] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-purple-400" />
              Product Ideas for {selectedCategory}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {categoryAnalyses[selectedCategory].product_ideas?.map((idea, idx) => (
                <IdeaCard key={idx} idea={idea} index={idx} />
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Cross-Category Insights */}
      {crossInsights && Object.keys(crossInsights).length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Cross-Category Insights
          </h3>
          <div className="prose prose-invert max-w-none">
            <pre className="bg-black/20 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(crossInsights, null, 2)}
            </pre>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const IdeaCard = ({ idea, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-6 border border-white/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-white mb-2">
            {idea.product_name || `Product Idea ${index + 1}`}
          </h4>
          <div className="text-sm text-white/60 mb-2">
            {idea.category_position || 'New Product'}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-purple-200">
            {idea.market_opportunity_score || 'N/A'}/10
          </span>
        </div>
      </div>

      {/* Attributes */}
      {idea.attributes && (
        <div className="space-y-3 mb-4">
          <div>
            <div className="text-xs text-white/50 mb-1">Primary Benefit</div>
            <div className="text-sm text-white">{idea.attributes.primary_benefit}</div>
          </div>

          {idea.attributes.key_ingredients && idea.attributes.key_ingredients.length > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-1">Key Ingredients</div>
              <div className="flex flex-wrap gap-2">
                {idea.attributes.key_ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-white/10 rounded text-xs text-white"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {idea.attributes.price_tier && (
            <div>
              <div className="text-xs text-white/50 mb-1">Price Tier</div>
              <div className="text-sm text-white">{idea.attributes.price_tier}</div>
            </div>
          )}
        </div>
      )}

      {/* Rationale */}
      {idea.rationale && (
        <div className="mb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-purple-300 hover:text-purple-200 underline"
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-3"
            >
              <div className="p-3 bg-black/20 rounded">
                <div className="text-xs text-white/50 mb-1">Why This Works</div>
                <div className="text-sm text-white/80">{idea.rationale}</div>
              </div>

              {idea.competitive_advantage && (
                <div className="p-3 bg-black/20 rounded">
                  <div className="text-xs text-white/50 mb-1">Competitive Advantage</div>
                  <div className="text-sm text-white/80">{idea.competitive_advantage}</div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};
