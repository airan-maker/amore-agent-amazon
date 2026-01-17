/**
 * Generate historical ranking data from a single snapshot
 * Creates realistic ranking variations for past dates
 */

/**
 * Generate a random rank variation within bounds
 * @param {number} currentRank - Current rank position
 * @param {number} maxRank - Maximum rank (usually 100)
 * @param {number} volatility - How much ranks can vary (0-1)
 * @returns {number} - New rank position
 */
const varyRank = (currentRank, maxRank = 100, volatility = 0.15) => {
  const maxChange = Math.floor(maxRank * volatility);
  const change = Math.floor(Math.random() * (maxChange * 2 + 1)) - maxChange;
  const newRank = currentRank + change;
  return Math.max(1, Math.min(maxRank, newRank));
};

/**
 * Vary rating slightly
 * @param {number} rating - Current rating
 * @returns {number} - New rating
 */
const varyRating = (rating) => {
  if (!rating) return rating;
  const change = (Math.random() - 0.5) * 0.2;
  return Math.max(1, Math.min(5, Number((rating + change).toFixed(2))));
};

/**
 * Vary review count slightly
 * @param {number} count - Current review count
 * @returns {number} - New review count
 */
const varyReviewCount = (count) => {
  if (!count) return count;
  const changePercent = (Math.random() - 0.7) * 0.15; // Trend slightly downward for past dates
  return Math.max(0, Math.floor(count * (1 + changePercent)));
};

/**
 * Generate historical rankings from current snapshot
 * @param {Object} currentSnapshot - Current ranking data (category_products.json format)
 * @param {string} currentDate - Current date (YYYY-MM-DD)
 * @param {number} daysBack - Number of days to generate backwards
 * @returns {Object} - Historical rankings by date and category
 */
export const generateHistoricalRankings = (currentSnapshot, currentDate, daysBack = 31) => {
  const historicalData = {};

  // Parse current date
  const currentDateObj = new Date(currentDate);

  // Generate data for each day
  for (let i = 0; i <= daysBack; i++) {
    const date = new Date(currentDateObj);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    historicalData[dateStr] = {};

    // Process each category
    Object.entries(currentSnapshot).forEach(([categoryName, categoryData]) => {
      if (!categoryData.success || !categoryData.products) return;

      // Create a copy of products with varied rankings
      const products = categoryData.products.map((product, index) => {
        // For current date, use original data
        if (i === 0) {
          return {
            ...product,
            rank: index + 1,
            date: dateStr
          };
        }

        // For historical dates, vary the data
        return {
          ...product,
          rank: varyRank(index + 1, categoryData.products_count || 100, 0.2),
          rating: varyRating(product.rating),
          review_count: varyReviewCount(product.review_count),
          date: dateStr
        };
      });

      // Sort by rank for historical dates
      if (i > 0) {
        products.sort((a, b) => a.rank - b.rank);
        // Reassign ranks to be sequential
        products.forEach((p, idx) => {
          p.rank = idx + 1;
        });
      }

      historicalData[dateStr][categoryName] = {
        ...categoryData,
        products,
        date: dateStr
      };
    });
  }

  return historicalData;
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
 * Prepare Excel export data
 * @param {Object} historicalData - Historical rankings data
 * @param {string} category - Category name
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} - Excel-ready data structure
 */
export const prepareExcelData = (historicalData, category, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get all dates in range
  const datesInRange = Object.keys(historicalData)
    .filter(date => {
      const d = new Date(date);
      return d >= start && d <= end;
    })
    .sort((a, b) => new Date(a) - new Date(b));

  if (datesInRange.length === 0) return [];

  // Build data structure: rows = ranks (1-100), columns = dates
  const data = [];
  const maxRank = 100;

  // Header row
  const header = ['Rank', ...datesInRange];
  data.push(header);

  // Data rows
  for (let rank = 1; rank <= maxRank; rank++) {
    const row = [rank];

    datesInRange.forEach(date => {
      const products = getRankingsForDate(historicalData, date, category);
      const product = products.find(p => p.rank === rank);
      row.push(product ? product.product_name : '-');
    });

    data.push(row);
  }

  return data;
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
