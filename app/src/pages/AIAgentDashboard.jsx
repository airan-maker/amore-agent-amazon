import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GlassSectionTitle } from '../components/GlassCard';
// import { BreadcrumbMapping } from '../components/M1_BreadcrumbMapping'; // 인사이트가 약해서 주석 처리
import { VolatilityIndex } from '../components/M1_VolatilityIndex';
import { EmergingBrands } from '../components/M1_EmergingBrands';
import { UsageContext } from '../components/M2_UsageContext';
import { IntelligenceBridge } from '../components/M2_IntelligenceBridge';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { Sparkles, BarChart3, MessageSquare } from 'lucide-react';

// Import data
// import breadcrumbData from '../data/m1_breadcrumb_traffic.json'; // 인사이트가 약해서 주석 처리
import volatilityData from '../data/m1_volatility_index.json';
import emergingBrandsData from '../data/m1_emerging_brands.json';
import usageContextData from '../data/m2_usage_context.json';
import intelligenceBridgeData from '../data/m2_intelligence_bridge.json';
import productDetailsData from '../data/product_details.json';

export const AIAgentDashboard = () => {
  const [activeModule, setActiveModule] = useState('m1');
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Debug: Track modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', selectedProductDetail ? 'OPEN' : 'CLOSED');
    if (selectedProductDetail) {
      console.log('Selected product detail:', selectedProductDetail);
    }
  }, [selectedProductDetail]);

  // Function to find product details by ASIN
  const handleProductClick = (brand, productName, asin) => {
    console.log('=== Product Click Event ===');
    console.log('Brand:', brand, 'Product:', productName, 'ASIN:', asin);
    console.log('Available ASINs in productDetailsData:', Object.keys(productDetailsData).length);

    // Try to find product details by ASIN
    if (asin && productDetailsData[asin]) {
      console.log('✅ Found product details for ASIN:', asin);
      const details = productDetailsData[asin];
      console.log('Product details structure:', {
        hasAnalysis: !!details.analysis,
        hasDetailedInfo: !!details.detailed_info,
        hasBasicInfo: !!details.basic_info
      });
      setSelectedProductDetail(details);
      console.log('Modal state updated - should show modal now');
    } else {
      console.log('❌ Product details not found for ASIN:', asin);
      // If no match found, show a placeholder with the product info
      const fallbackData = {
        basic_info: {
          product_name: `${brand} ${productName}`,
          asin: asin,
        },
        error: `이 제품의 상세 정보를 찾을 수 없습니다 (ASIN: ${asin}). 아직 데이터가 수집되지 않았습니다.`
      };
      console.log('Setting fallback data:', fallbackData);
      setSelectedProductDetail(fallbackData);
    }
    console.log('=== End Product Click Event ===');
  };

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-[1800px] mx-auto"
      >
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-sm tracking-[0.3em] text-white/70 uppercase">
              AMORE PACIFIC AI AGENT 07
            </span>
          </motion.div>

          <h1 className="text-6xl font-extralight tracking-[0.2em] text-white/95 mb-6 text-gradient">
            LANEIGE INTELLIGENCE
          </h1>
          <p className="text-lg font-light text-white/60 tracking-wider max-w-3xl mx-auto leading-relaxed">
            미국 Amazon Market의 흐름과 소비자의 목소리를 통합적으로 분석함으로써<br/>
            LANEIGE의 미국 시장에서의 성장을 지원합니다
          </p>
        </div>

        {/* Module Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-4 mb-16"
        >
          {[
            { id: 'm1', label: 'Market Landscape', icon: BarChart3 },
            { id: 'm2', label: 'Review Intelligence', icon: MessageSquare },
          ].map((module, idx) => {
            const Icon = module.icon;
            return (
              <motion.button
                key={module.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveModule(module.id)}
                className={`
                  flex items-center gap-3 px-8 py-4 rounded-xl
                  font-light tracking-wider transition-all duration-300
                  ${activeModule === module.id
                    ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border-2 border-purple-400/50 text-white shadow-lg'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white/90 hover:border-purple-400/30'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {module.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Brand 경쟁 구도 & Market Landscape */}
        {activeModule === 'm1' && (
          <section className="mb-20">
            <GlassSectionTitle className="mb-12">
              Brand 경쟁 구도 & Market Landscape
            </GlassSectionTitle>

            <div className="space-y-8">
              <VolatilityIndex data={volatilityData} />
              <EmergingBrands data={emergingBrandsData} />
              {/* <BreadcrumbMapping data={breadcrumbData} onProductClick={handleProductClick} /> */} {/* 인사이트가 약해서 주석 처리 */}
            </div>
          </section>
        )}

        {/* Review Intelligence */}
        {activeModule === 'm2' && (
          <section className="mb-20">
            <GlassSectionTitle className="mb-12">
              Review Intelligence - Consumer Needs Mapping
            </GlassSectionTitle>

            <div className="space-y-8">
              <UsageContext data={usageContextData} onProductClick={handleProductClick} />
              <IntelligenceBridge data={intelligenceBridgeData} />
            </div>
          </section>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-white/30 tracking-[0.2em]">
            <Sparkles className="w-4 h-4" />
            <span>Powered by AMORE PACIFIC AI AGENT 07</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Product Detail Modal */}
      <AnimatePresence mode="wait">
        {selectedProductDetail && (
          <ProductDetailModal
            key="product-detail-modal"
            product={selectedProductDetail}
            onClose={() => setSelectedProductDetail(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
