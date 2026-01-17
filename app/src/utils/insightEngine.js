/**
 * Insight Engine - Extracts business insights from product data
 * Analyzes product_details.json and category_products.json to answer business questions
 */

export class InsightEngine {
  constructor(productDetails, categoryProducts) {
    this.productDetails = productDetails;
    this.categoryProducts = categoryProducts;
    this.allProducts = this.extractAllProducts();
  }

  // Extract all products from category data
  extractAllProducts() {
    const products = [];
    Object.entries(this.categoryProducts).forEach(([category, data]) => {
      if (data.success && data.products) {
        data.products.forEach(product => {
          products.push({
            ...product,
            category: category,
            details: this.productDetails[product.asin]
          });
        });
      }
    });
    return products;
  }

  // Get LANEIGE products
  getLaneigeProducts() {
    return this.allProducts.filter(p =>
      p.product_name?.toLowerCase().includes('laneige') ||
      p.brand?.toLowerCase().includes('laneige')
    );
  }

  // Get competitor products in same categories
  getCompetitors(brand = 'laneige') {
    const brandProducts = this.allProducts.filter(p =>
      p.product_name?.toLowerCase().includes(brand.toLowerCase())
    );

    const categories = [...new Set(brandProducts.map(p => p.category))];

    const competitors = this.allProducts.filter(p =>
      categories.includes(p.category) &&
      !p.product_name?.toLowerCase().includes(brand.toLowerCase())
    );

    // Group by brand and count
    const brandCounts = {};
    competitors.forEach(p => {
      const productBrand = this.extractBrand(p.product_name);
      brandCounts[productBrand] = (brandCounts[productBrand] || 0) + 1;
    });

    return Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand, count]) => ({ brand, productCount: count }));
  }

  // Extract brand from product name
  extractBrand(productName) {
    if (!productName) return 'Unknown';
    const words = productName.split(/[\s-]/);
    return words[0];
  }

  // Get price range analysis
  getPriceAnalysis(category = null) {
    let products = category
      ? this.allProducts.filter(p => p.category === category)
      : this.allProducts;

    const prices = products
      .map(p => p.price)
      .filter(p => p && typeof p === 'string')
      .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
      .filter(p => !isNaN(p) && p > 0);

    if (prices.length === 0) return null;

    prices.sort((a, b) => a - b);

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      median: prices[Math.floor(prices.length / 2)],
      count: prices.length
    };
  }

  // Get rating analysis
  getRatingAnalysis(brand = null) {
    let products = brand
      ? this.allProducts.filter(p =>
          p.product_name?.toLowerCase().includes(brand.toLowerCase())
        )
      : this.allProducts;

    const ratings = products
      .map(p => parseFloat(p.rating))
      .filter(r => !isNaN(r) && r > 0);

    if (ratings.length === 0) return null;

    return {
      avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      min: Math.min(...ratings),
      max: Math.max(...ratings),
      count: ratings.length,
      above4: ratings.filter(r => r >= 4.0).length,
      above45: ratings.filter(r => r >= 4.5).length
    };
  }

  // Get review count analysis
  getReviewAnalysis(brand = null) {
    let products = brand
      ? this.allProducts.filter(p =>
          p.product_name?.toLowerCase().includes(brand.toLowerCase())
        )
      : this.allProducts;

    const reviews = products
      .map(p => parseInt(p.review_count))
      .filter(r => !isNaN(r) && r > 0);

    if (reviews.length === 0) return null;

    reviews.sort((a, b) => b - a);

    return {
      total: reviews.reduce((a, b) => a + b, 0),
      avg: reviews.reduce((a, b) => a + b, 0) / reviews.length,
      max: reviews[0],
      top10Avg: reviews.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(10, reviews.length),
      count: reviews.length
    };
  }

  // Get top products by category
  getTopProducts(category, limit = 10) {
    return this.allProducts
      .filter(p => p.category === category)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        const reviewA = parseInt(a.review_count) || 0;
        const reviewB = parseInt(b.review_count) || 0;

        // Sort by rating first, then by review count
        if (ratingB !== ratingA) return ratingB - ratingA;
        return reviewB - reviewA;
      })
      .slice(0, limit);
  }

  // Get category visibility (by product count in top listings)
  getCategoryVisibility(category = null) {
    let products = category
      ? this.allProducts.filter(p => p.category === category)
      : this.allProducts;

    const brandCounts = {};
    products.forEach(p => {
      const brand = this.extractBrand(p.product_name);
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });

    const total = Object.values(brandCounts).reduce((a, b) => a + b, 0);

    return Object.entries(brandCounts)
      .map(([brand, count]) => ({
        brand,
        count,
        listingShare: ((count / total) * 100).toFixed(1) // Listing share within top 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }

  // Get key features analysis for a brand
  getKeyFeatures(brand = 'laneige') {
    const brandProducts = this.allProducts
      .filter(p => p.product_name?.toLowerCase().includes(brand.toLowerCase()))
      .filter(p => p.details?.analysis?.key_features);

    if (brandProducts.length === 0) return null;

    const features = {
      formulas: [],
      ingredients: [],
      benefits: [],
      scents: []
    };

    brandProducts.forEach(p => {
      const kf = p.details?.analysis?.key_features;
      if (kf) {
        if (kf.formula) features.formulas.push(kf.formula);
        if (kf.ingredients) features.ingredients.push(kf.ingredients);
        if (kf.benefits) features.benefits.push(kf.benefits);
        if (kf.scent) features.scents.push(kf.scent);
      }
    });

    return features;
  }

  // Get sentiment analysis
  getSentimentAnalysis(brand = 'laneige') {
    const brandProducts = this.allProducts
      .filter(p => p.product_name?.toLowerCase().includes(brand.toLowerCase()))
      .filter(p => p.details?.analysis?.review_summary);

    if (brandProducts.length === 0) return null;

    const positives = [];
    const negatives = [];

    brandProducts.forEach(p => {
      const review = p.details?.analysis?.review_summary;
      if (review) {
        if (Array.isArray(review.positive)) {
          positives.push(...review.positive);
        }
        if (Array.isArray(review.negative)) {
          negatives.push(...review.negative);
        }
      }
    });

    return {
      positives: [...new Set(positives)].slice(0, 10),
      negatives: [...new Set(negatives)].slice(0, 10),
      productCount: brandProducts.length
    };
  }

  // Get category analysis
  getCategoryAnalysis() {
    const categories = {};

    Object.entries(this.categoryProducts).forEach(([category, data]) => {
      if (data.success && data.products) {
        const products = data.products;
        const ratings = products
          .map(p => parseFloat(p.rating))
          .filter(r => !isNaN(r) && r > 0);

        const prices = products
          .map(p => p.price)
          .filter(p => p && typeof p === 'string')
          .map(p => parseFloat(p.replace(/[^0-9.]/g, '')))
          .filter(p => !isNaN(p) && p > 0);

        categories[category] = {
          productCount: products.length,
          avgRating: ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
            : null,
          avgPrice: prices.length > 0
            ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
            : null,
          priceRange: prices.length > 0
            ? { min: Math.min(...prices).toFixed(2), max: Math.max(...prices).toFixed(2) }
            : null
        };
      }
    });

    return categories;
  }
}

export default InsightEngine;
