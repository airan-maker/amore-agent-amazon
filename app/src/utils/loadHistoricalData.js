/**
 * Load real historical data from collected snapshots
 * Reads all beauty_rankings_YYYYMMDD.json files from historical folder
 */

// Category hierarchy with depth information
export const CATEGORY_HIERARCHY = {
  // Depth 0 - Top level
  'Beauty & Personal Care': { depth: 0, parent: null },

  // Depth 1 - Main categories
  'Perfumes & Fragrances': { depth: 1, parent: 'Beauty & Personal Care' },
  'Foot, Hand & Nail Care': { depth: 1, parent: 'Beauty & Personal Care' },
  'Hair Care': { depth: 1, parent: 'Beauty & Personal Care' },
  'Makeup': { depth: 1, parent: 'Beauty & Personal Care' },
  'Personal Care': { depth: 1, parent: 'Beauty & Personal Care' },
  'Salon & Spa Equipment': { depth: 1, parent: 'Beauty & Personal Care' },
  'Shaving & Grooming': { depth: 1, parent: 'Beauty & Personal Care' },
  'Skin Care': { depth: 1, parent: 'Beauty & Personal Care' },
  'Tools & Accessories': { depth: 1, parent: 'Beauty & Personal Care' },

  // Depth 2 - Makeup subcategories
  'Body Makeup': { depth: 2, parent: 'Makeup' },
  'Eye Makeup': { depth: 2, parent: 'Makeup' },
  'Face Makeup': { depth: 2, parent: 'Makeup' },
  'Lip Makeup': { depth: 2, parent: 'Makeup' },
  'Makeup Sets & Kits': { depth: 2, parent: 'Makeup' },
  'Makeup Palettes': { depth: 2, parent: 'Makeup' },
  'Makeup Remover': { depth: 2, parent: 'Makeup' },

  // Depth 2 - Skin Care subcategories
  'Facial Skin Care': { depth: 2, parent: 'Skin Care' },
  'Body Skin Care': { depth: 2, parent: 'Skin Care' },
  'Eye Treatment': { depth: 2, parent: 'Skin Care' },
  'Maternity Skin Care': { depth: 2, parent: 'Skin Care' },
  'Skin Care Sets & Kits': { depth: 2, parent: 'Skin Care' },
  'Sun Skin Care': { depth: 2, parent: 'Skin Care' },
  'Lip Care': { depth: 2, parent: 'Skin Care' },
};

/**
 * Get category depth (0, 1, or 2)
 * @param {string} categoryName - Category name
 * @returns {number} - Depth level (0, 1, or 2), defaults to 2 if unknown
 */
export const getCategoryDepth = (categoryName) => {
  return CATEGORY_HIERARCHY[categoryName]?.depth ?? 2;
};

/**
 * Get sorted categories by hierarchy
 * @param {string[]} categories - Array of category names
 * @returns {Array<{name: string, depth: number}>} - Sorted categories with depth
 */
export const getSortedCategoriesWithDepth = (categories) => {
  return categories
    .map(name => ({
      name,
      depth: getCategoryDepth(name),
      parent: CATEGORY_HIERARCHY[name]?.parent || null
    }))
    .sort((a, b) => {
      // Sort by depth first, then alphabetically
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.name.localeCompare(b.name);
    });
};

// Import all historical data files
// Note: In production, these would be dynamically imported
// For now, we manually import the available files

const importHistoricalData = async () => {
  const historicalData = {};

  // Use Vite's import.meta.glob to dynamically import all historical files
  // This automatically detects all beauty_rankings_*.json files in the historical folder
  const historicalFiles = import.meta.glob('../data/historical/beauty_rankings_*.json', { eager: true });

  // Process each file
  for (const [path, module] of Object.entries(historicalFiles)) {
    try {
      // Extract date from filename: beauty_rankings_20260109.json -> 20260109
      const match = path.match(/beauty_rankings_(\d{8})\.json$/);

      if (match) {
        const dateStr = match[1];

        // Convert YYYYMMDD to YYYY-MM-DD format
        const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

        historicalData[formattedDate] = module.default;

        console.log(`✓ Loaded data for ${formattedDate}`);
      }
    } catch (error) {
      console.warn(`Could not load file ${path}:`, error.message);
    }
  }

  return historicalData;
};

/**
 * Load all historical ranking data
 * @returns {Promise<Object>} - Historical data indexed by date (YYYY-MM-DD)
 */
export const loadHistoricalRankings = async () => {
  console.log('📊 Loading real historical ranking data...');

  const data = await importHistoricalData();

  console.log(`✅ Loaded ${Object.keys(data).length} days of historical data`);

  return data;
};

/**
 * Get available dates from historical data
 * @param {Object} historicalData - Historical rankings data
 * @returns {string[]} - Sorted array of date strings (newest first)
 */
export const getAvailableDates = (historicalData) => {
  return Object.keys(historicalData).sort((a, b) => new Date(b) - new Date(a));
};

/**
 * Get the most recent date with data
 * @param {Object} historicalData - Historical rankings data
 * @returns {string} - Most recent date (YYYY-MM-DD)
 */
export const getMostRecentDate = (historicalData) => {
  const dates = getAvailableDates(historicalData);
  return dates.length > 0 ? dates[0] : null;
};

/**
 * Get rankings for a specific date and category
 * @param {Object} historicalData - Historical rankings data
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string} category - Category name
 * @returns {Array} - Products array for that date/category
 */
export const getRankingsForDate = (historicalData, date, category) => {
  if (!historicalData[date]) return [];
  if (!historicalData[date][category]) return [];
  return historicalData[date][category].products || [];
};

/**
 * Get all categories from historical data
 * @param {Object} historicalData - Historical rankings data
 * @returns {string[]} - Array of category names
 */
export const getAvailableCategories = (historicalData) => {
  const categorySet = new Set();

  // Get categories from the most recent date
  const mostRecentDate = getMostRecentDate(historicalData);
  if (!mostRecentDate) return [];

  const dateData = historicalData[mostRecentDate];
  Object.values(dateData).forEach(categoryData => {
    if (categoryData.success && categoryData.category) {
      categorySet.add(categoryData.category);
    }
  });

  return Array.from(categorySet);
};

/**
 * Format date for display
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} - Formatted date
 */
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Analyze ranking trends for a category
 * @param {Object} historicalData - Historical rankings data
 * @param {string} category - Category name
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} - Trend analysis data
 */
export const analyzeCategoryTrends = (historicalData, category, startDate, endDate) => {
  const dates = Object.keys(historicalData)
    .filter(date => date >= startDate && date <= endDate)
    .sort();

  if (dates.length < 2) {
    return null;
  }

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  const startProducts = getRankingsForDate(historicalData, firstDate, category);
  const endProducts = getRankingsForDate(historicalData, lastDate, category);

  // Create product map by ASIN for comparison
  const productMap = new Map();

  startProducts.forEach(p => {
    if (p.asin) {
      productMap.set(p.asin, {
        ...p,
        startRank: p.rank,
        startDate: firstDate
      });
    }
  });

  endProducts.forEach(p => {
    if (p.asin && productMap.has(p.asin)) {
      const existing = productMap.get(p.asin);
      productMap.set(p.asin, {
        ...existing,
        endRank: p.rank,
        endDate: lastDate,
        rankChange: existing.startRank - p.rank
      });
    }
  });

  // Find top movers
  const productsWithChange = Array.from(productMap.values())
    .filter(p => p.rankChange !== undefined);

  const gainers = productsWithChange
    .filter(p => p.rankChange > 0)
    .sort((a, b) => b.rankChange - a.rankChange)
    .slice(0, 5)
    .map(p => ({
      ...p,
      improvement: p.rankChange
    }));

  const losers = productsWithChange
    .filter(p => p.rankChange < 0)
    .sort((a, b) => a.rankChange - b.rankChange)
    .slice(0, 5)
    .map(p => ({
      ...p,
      decline: Math.abs(p.rankChange)
    }));

  // Calculate statistics
  const improvingCount = productsWithChange.filter(p => p.rankChange > 0).length;
  const decliningCount = productsWithChange.filter(p => p.rankChange < 0).length;
  const stableCount = productsWithChange.filter(p => p.rankChange === 0).length;

  const avgVolatility = productsWithChange.reduce((sum, p) => {
    return sum + Math.abs(p.rankChange);
  }, 0) / productsWithChange.length;

  return {
    totalProducts: productsWithChange.length,
    improvingCount,
    decliningCount,
    stableCount,
    avgVolatility,
    topMovers: {
      gainers,
      losers
    },
    allProducts: productsWithChange
  };
};

/**
 * Get product ranking history
 * @param {Object} historicalData - Historical rankings data
 * @param {string} asin - Product ASIN
 * @param {string} category - Category name
 * @returns {Array} - Ranking history
 */
export const getProductRankingHistory = (historicalData, asin, category) => {
  const dates = Object.keys(historicalData).sort();
  const history = [];

  dates.forEach(date => {
    const products = getRankingsForDate(historicalData, date, category);
    const product = products.find(p => p.asin === asin);

    if (product) {
      history.push({
        date,
        rank: product.rank,
        rating: product.rating,
        review_count: product.review_count
      });
    }
  });

  return history;
};
