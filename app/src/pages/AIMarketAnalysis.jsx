import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { GlassCard, GlassSectionTitle } from '../components/GlassCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { Package, Filter, Download, Calendar } from 'lucide-react';

// Import analysis modules
import { AICategoryInsights } from '../components/analysis/AICategoryInsights';
import { MarketConcentration } from '../components/analysis/MarketConcentration';
import { USPClustering } from '../components/analysis/USPClustering';
import { LaneigePositioning } from '../components/analysis/LaneigePositioning';
import { RisingStars } from '../components/analysis/RisingStars';
import { StrategicOpportunity } from '../components/analysis/StrategicOpportunity';

// Import data and utilities
import productDetailsData from '../data/product_details.json';
import {
  loadHistoricalRankings,
  getAvailableDates,
  getMostRecentDate,
  getRankingsForDate,
  formatDate,
  getAvailableCategories,
  getSortedCategoriesWithDepth,
  getCategoryDepth
} from '../utils/loadHistoricalData';
import { exportRankingsToExcel } from '../utils/excelExport';

export const AIMarketAnalysis = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // Will be set to most recent date
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [historicalData, setHistoricalData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Debug: Track modal state changes
  useEffect(() => {
    console.log('🔍 [ProductCatalog] Modal state changed:', selectedProduct ? 'OPEN' : 'CLOSED');
    if (selectedProduct) {
      console.log('[ProductCatalog] Selected product:', selectedProduct);
    }
  }, [selectedProduct]);

  // Load real historical data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📊 Loading real historical rankings data...');

        // Load real collected data from historical folder
        const historical = await loadHistoricalRankings();
        setHistoricalData(historical);

        // Get available dates (sorted newest first)
        const dates = getAvailableDates(historical);
        setAvailableDates(dates);

        // Get most recent date
        const mostRecentDate = getMostRecentDate(historical);
        if (mostRecentDate) {
          setSelectedDate(mostRecentDate);

          // Set export date range to available data range
          setExportStartDate(dates[dates.length - 1]); // Oldest date
          setExportEndDate(mostRecentDate); // Newest date

          console.log(`✅ Most recent data: ${mostRecentDate}`);
        }

        // Get categories
        const categoryList = getAvailableCategories(historical);
        setCategories(categoryList);

        // Set "Beauty & Personal Care" as default if available, otherwise first category
        if (categoryList.includes('Beauty & Personal Care')) {
          setSelectedCategory('Beauty & Personal Care');
        } else if (categoryList.length > 0) {
          setSelectedCategory(categoryList[0]);
        }

        console.log('✅ Real historical data loaded:', {
          dates: dates.length,
          categories: categoryList.length,
          dateRange: `${dates[dates.length - 1]} to ${mostRecentDate}`
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading historical data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update products when date or category changes
  useEffect(() => {
    if (!historicalData || !selectedDate) return;

    try {
      const allProducts = [];

      const dateData = historicalData[selectedDate];
      if (!dateData) {
        console.warn('No data for date:', selectedDate);
        setProducts([]);
        return;
      }

      Object.entries(dateData).forEach(([categoryName, categoryData]) => {
        if (categoryData.success && categoryData.products) {
          categoryData.products.forEach(product => {
            const brand = extractBrand(product.product_name, product.asin);

            allProducts.push({
              ...product,
              category: categoryName,
              brand: brand,
              date: selectedDate
            });
          });
        }
      });

      setProducts(allProducts);
      console.log(`📅 Loaded ${allProducts.length} products for ${selectedDate}`);
    } catch (error) {
      console.error('Error loading products for date:', error);
    }
  }, [historicalData, selectedDate]);

  // Known multi-word brands (2+ words)
  const knownBrands = [
    'Amazon Basics', 'Tree Hut', 'La Roche-Posay', 'Summer Fridays',
    "Burt's Bees", 'Hero Cosmetics', 'Mighty Patch', 'Kate Somerville',
    'The Ordinary', 'Drunk Elephant', 'Tower 28', 'Glow Recipe',
    'Youth To The People', 'First Aid Beauty', 'Sol de Janeiro',
    'Fresh Rose', "Kiehl's", 'Mario Badescu', 'Peter Thomas Roth',
    'Dr. Jart+', 'Tatcha', 'SK-II', 'Estée Lauder', 'Clinique',
    'MAC', 'NARS', 'Urban Decay', 'Too Faced', 'Benefit',
    'Maybelline New York', 'NYX Professional Makeup', 'e.l.f.',
    'Wet n Wild', 'Milani', "L'Oréal Paris", 'Revlon',
    'Neutrogena', 'CeraVe', 'Cetaphil', 'Aquaphor', 'Eucerin',
    'Aveeno', 'Dove', 'Olay', 'Garnier', 'Nivea',
    'The INKEY List', "Paula's Choice", 'Pixi', 'Glossier',
    'Fenty Beauty', 'Rare Beauty', 'Rhode', 'Huda Beauty',
    'Charlotte Tilbury', 'Pat McGrath Labs', 'Anastasia Beverly Hills',
    'LANEIGE', 'Innisfree', 'COSRX', 'Some By Mi', 'Etude House',
    'medicube', 'Anua', 'Beauty of Joseon', 'SKIN1004'
  ];

  // Extract brand from product name
  const extractBrand = (productName, asin) => {
    if (!productName) return 'Unknown';

    // 1. Try to get brand from product details (most accurate)
    if (productDetailsData[asin]?.detailed_info?.product_details?.brand) {
      return productDetailsData[asin].detailed_info.product_details.brand;
    }

    // 2. Check against known multi-word brands
    const nameLower = productName.toLowerCase();
    for (const brand of knownBrands) {
      if (nameLower.startsWith(brand.toLowerCase())) {
        return brand;
      }
    }

    // 3. Try pattern matching for common brand formats
    const brandPatterns = [
      // Brand followed by specific keywords
      /^([A-Z][A-Za-z0-9'\s&.]+?)\s+(?:Shea|Dewy|Hydrating|Moisturizing|Exfoliating|Vitamin|Hypoallergenic|Natural|Organic|Professional|Beauty|Cosmetics|Skincare|Makeup)/i,
      // Brand followed by product type
      /^([A-Z][A-Za-z0-9'\s&.]+?)\s+(?:Lip|Face|Skin|Eye|Body|Hair|Nail)/i,
      // Brand followed by dash or numbers
      /^([A-Z][A-Za-z0-9'\s&.]+?)\s*(?:-|™|®|\d)/,
      // Special single-letter brands
      /^(eos|EOS)(?:\s|$)/,
      /^(e\.l\.f\.|elf)(?:\s|$)/i,
    ];

    for (const pattern of brandPatterns) {
      const match = productName.match(pattern);
      if (match) {
        const brand = match[1].trim();
        // Exclude too-long matches (likely not just brand name)
        if (brand.length < 50 && brand.split(' ').length <= 4) {
          return brand;
        }
      }
    }

    // 4. Fallback: first 1-2 words
    const words = productName.split(/[\s-]/);
    if (words.length >= 2 && words[1].length > 2) {
      // Check if second word looks like part of brand name (capitalized)
      if (/^[A-Z]/.test(words[1])) {
        return `${words[0]} ${words[1]}`;
      }
    }

    return words[0] || 'Unknown';
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter(product => product.category === selectedCategory);
  }, [products, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/70 text-xl">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-[1800px] mx-auto"
      >
        {/* Header */}
        <div className="pt-8 mb-16 text-center">
          <h1 className="text-6xl font-extralight tracking-[0.2em] text-white/95 mb-6 text-gradient">
            LANEIGE INTELLIGENCE
          </h1>
          <p className="text-lg font-light text-white/60 tracking-wider max-w-3xl mx-auto leading-relaxed">
            미국 Amazon Market의 흐름과 소비자의 목소리를 통합적으로 분석함으로써<br/>
            LANEIGE의 미국 시장에서의 성장을 지원합니다
          </p>
        </div>

        {/* Filters */}
        <GlassCard className="mb-8 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-400" />
              <span className="text-white/70 font-light">Filters:</span>
            </div>

            {/* Category Filter with Depth Color Coding */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 focus:border-purple-400/50 focus:outline-none transition-colors min-w-[280px]"
            >
              {getSortedCategoriesWithDepth(categories).map(({ name, depth }) => (
                <option
                  key={name}
                  value={name}
                  className="bg-gray-900"
                  style={{
                    color: depth === 0 ? '#fbbf24' : depth === 1 ? '#60a5fa' : '#9ca3af',
                    fontWeight: depth === 0 ? 'bold' : depth === 1 ? '500' : 'normal',
                  }}
                >
                  {depth === 0 ? '★ ' : depth === 1 ? '● ' : '  └ '}{name}
                </option>
              ))}
            </select>
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-300" />
              <span className="text-white/70 font-light">Date:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 focus:border-purple-400/50 focus:outline-none transition-colors"
              >
                {availableDates.map(date => (
                  <option key={date} value={date} className="bg-gray-900">
                    {formatDate(date)}
                  </option>
                ))}
              </select>
            </div>

            {/* Excel Export Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-300 hover:border-green-400/50 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-light">Export to Excel</span>
            </motion.button>

            <div className="ml-auto text-white/50 text-sm">
              {filteredProducts.length} products
            </div>
          </div>
        </GlassCard>

        {/* Ranking Table */}
        {selectedCategory && filteredProducts.length > 0 && (
          <GlassCard className="mb-8 p-8">
            <div className="flex items-start justify-between mb-6">
              <GlassSectionTitle icon={Package}>
                {selectedCategory} Top 100 (Amazon US)
              </GlassSectionTitle>
              <div className="text-right">
                <div className="text-sm text-white/50 mb-1">상세 정보 수집</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/80 font-light">
                    {filteredProducts.filter(p => productDetailsData[p.asin]).length} / {filteredProducts.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/50 font-light text-sm">Rank</th>
                    <th className="text-left py-3 px-4 text-white/50 font-light text-sm">Product (클릭 시, 상세 정보 확인 가능)</th>
                    <th className="text-left py-3 px-4 text-white/50 font-light text-sm">Brand</th>
                    <th className="text-left py-3 px-4 text-white/50 font-light text-sm">Rating</th>
                    <th className="text-left py-3 px-4 text-white/50 font-light text-sm">Reviews</th>
                    <th className="text-left py-3 px-4 text-white/50 font-light text-sm">ASIN</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={`${product.category}-${product.asin}-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={`border-b border-white/5 transition-colors cursor-pointer ${
                        productDetailsData[product.asin]
                          ? 'hover:bg-purple-500/10 hover:border-purple-400/30'
                          : 'hover:bg-white/5'
                      }`}
                      onClick={() => {
                        console.log('=== [ProductCatalog] Product Row Click ===');
                        console.log('Product:', product.product_name);
                        console.log('ASIN:', product.asin);

                        const details = productDetailsData[product.asin];
                        console.log('Details found for this ASIN:', details ? '✅ Yes' : '❌ No');

                        if (details) {
                          setSelectedProduct(details);
                          console.log('Modal should open now');
                        } else {
                          const fallbackData = {
                            basic_info: product,
                            analysis: {
                              product_name: product.product_name,
                              rating: product.rating,
                            },
                            error: `상세 정보를 찾을 수 없습니다 (ASIN: ${product.asin}). 이 제품의 상세 데이터가 아직 수집되지 않았습니다.`
                          };
                          console.log('Using fallback data');
                          setSelectedProduct(fallbackData);
                        }
                        console.log('=== End Product Row Click ===');
                      }}
                    >
                      <td className="py-3 px-4 text-white/40 text-sm">{product.rank || index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="text-white/90 font-light max-w-md hover:text-purple-300 transition-colors flex items-center gap-2">
                          {product.product_name}
                          {productDetailsData[product.asin] && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.brand.toLowerCase().includes('laneige')
                            ? 'bg-pink-500/20 text-pink-300'
                            : 'bg-white/10 text-white/70'
                        }`}>
                          {product.brand}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/80">
                        {product.rating ? `⭐ ${product.rating}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-white/60 text-sm">
                        {product.review_count?.toLocaleString() || '-'}
                      </td>
                      <td className="py-3 px-4 text-white/40 text-xs font-mono">
                        {product.asin}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* AI Category Insights */}
        {selectedCategory && historicalData && (
          <AICategoryInsights
            category={selectedCategory}
            historicalData={historicalData}
            availableDates={availableDates}
          />
        )}

        {/* Analysis Dashboard */}
        {selectedCategory && filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 mb-8"
          >
            {/* Market Concentration */}
            <MarketConcentration products={filteredProducts} />

            {/* USP Clustering */}
            <USPClustering products={filteredProducts} />

            {/* LANEIGE vs Market */}
            <LaneigePositioning
              products={filteredProducts}
              productDetails={productDetailsData}
            />

            {/* Rising Stars */}
            <RisingStars products={filteredProducts} />

            {/* Strategic Opportunity */}
            <StrategicOpportunity
              products={filteredProducts}
              productDetails={productDetailsData}
            />
          </motion.div>
        )}

        {/* Product Detail Modal */}
        <AnimatePresence mode="wait">
          {selectedProduct && (
            <ProductDetailModal
              key="product-modal"
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              historicalData={historicalData}
              category={selectedCategory}
            />
          )}
        </AnimatePresence>

        {/* Excel Export Modal */}
        <AnimatePresence mode="wait">
          {showExportModal && (
            <motion.div
              key="export-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowExportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-gray-900/95 to-purple-900/95 border border-white/10 rounded-2xl p-8 max-w-md w-full"
              >
                <h3 className="text-2xl font-light text-white/90 mb-6 flex items-center gap-3">
                  <Download className="w-6 h-6 text-green-400" />
                  Export Rankings to Excel
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Category</label>
                    <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90">
                      {selectedCategory}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Start Date</label>
                    <select
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 focus:border-purple-400/50 focus:outline-none transition-colors"
                    >
                      {availableDates.slice().reverse().map(date => (
                        <option key={date} value={date} className="bg-gray-900">
                          {formatDate(date)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">End Date</label>
                    <select
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 focus:border-purple-400/50 focus:outline-none transition-colors"
                    >
                      {availableDates.map(date => (
                        <option key={date} value={date} className="bg-gray-900">
                          {formatDate(date)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-white/40 text-xs p-3 rounded-lg bg-white/5">
                    ℹ️ Excel file will contain ranking data (1-100) with product names for each date in the selected range.
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      exportRankingsToExcel(historicalData, selectedCategory, exportStartDate, exportEndDate);
                      setShowExportModal(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-light transition-all"
                  >
                    Download Excel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
