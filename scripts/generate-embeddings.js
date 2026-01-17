/**
 * RAG Embedding Generation Script
 * Generates embeddings for products, reviews, and insights using Voyage AI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VoyageAIClient } from 'voyageai';
import { connect } from '@lancedb/lancedb';
import dotenv from 'dotenv';

// ES Module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Voyage AI client
const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY
});

// Paths
const DATA_PATH = path.join(__dirname, '..', 'app', 'src', 'data');
const DB_PATH = path.join(__dirname, '..', 'lancedb_data');

/**
 * Embed Product Data
 */
async function embedProducts() {
  console.log('\n📦 Processing product_details.json...');

  const productsPath = path.join(DATA_PATH, 'product_details.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

  const chunks = [];
  let processedCount = 0;

  for (const [asin, product] of Object.entries(products)) {
    const basicInfo = product.basic_info || {};
    const detailedInfo = product.detailed_info || {};

    // Skip if no title
    if (!detailedInfo.title && !basicInfo.product_name) {
      continue;
    }

    const title = detailedInfo.title || basicInfo.product_name;
    const brand = basicInfo.brand || 'Unknown';
    const category = basicInfo.category || 'Unknown';

    // Chunk 1: Product Title + Basic Info
    chunks.push({
      id: `${asin}_title`,
      text: `${title} by ${brand}. Price: $${basicInfo.price || 'N/A'}, Rating: ${basicInfo.rating || 'N/A'}★ (${basicInfo.review_count || 0} reviews). Category: ${category}`,
      metadata: {
        asin,
        chunk_type: 'product_title',
        product_name: title,
        brand,
        category,
        rating: basicInfo.rating || 0,
        review_count: basicInfo.review_count || 0,
        price: basicInfo.price || 0
      }
    });

    // Chunk 2-N: Features (each feature separately)
    if (detailedInfo.features && Array.isArray(detailedInfo.features)) {
      detailedInfo.features.forEach((feature, idx) => {
        if (feature && feature.trim()) {
          chunks.push({
            id: `${asin}_feature_${idx}`,
            text: `${title} - Feature: ${feature.trim()}`,
            metadata: {
              asin,
              chunk_type: 'product_feature',
              product_name: title,
              brand,
              category,
              feature_idx: idx
            }
          });
        }
      });
    }

    // Chunk N+1: About Items (if exists, combined)
    if (detailedInfo.about_items && Array.isArray(detailedInfo.about_items) && detailedInfo.about_items.length > 0) {
      const aboutText = detailedInfo.about_items.filter(item => item && item.trim()).join(' ');
      if (aboutText.trim()) {
        // Split into chunks of ~500 characters with 100 char overlap
        const aboutChunks = createOverlappingChunks(aboutText, 500, 100);
        aboutChunks.forEach((chunk, idx) => {
          chunks.push({
            id: `${asin}_about_${idx}`,
            text: `${title} - Description: ${chunk}`,
            metadata: {
              asin,
              chunk_type: 'product_about',
              product_name: title,
              brand,
              category,
              chunk_idx: idx
            }
          });
        });
      }
    }

    processedCount++;
    if (processedCount % 50 === 0) {
      console.log(`  Processed ${processedCount} products...`);
    }
  }

  console.log(`\n✅ Generated ${chunks.length} product chunks from ${processedCount} products`);

  // Generate embeddings
  const embeddings = await generateEmbeddingsBatch(chunks, 'Products');

  // Save to LanceDB
  await saveToLanceDB('products', chunks, embeddings);

  return { count: chunks.length, cost: calculateCost(chunks.map(c => c.text)) };
}

/**
 * Embed Review Data
 */
async function embedReviews() {
  console.log('\n💬 Processing extracted_reviews.json...');

  const reviewsPath = path.join(DATA_PATH, 'extracted_reviews.json');

  if (!fs.existsSync(reviewsPath)) {
    console.log('⚠️  extracted_reviews.json not found, skipping reviews');
    return { count: 0, cost: 0 };
  }

  const reviewsData = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
  const chunks = [];

  for (const [asin, data] of Object.entries(reviewsData)) {
    if (!data.reviews || !Array.isArray(data.reviews)) continue;

    data.reviews.forEach((review, idx) => {
      if (!review.text || !review.text.trim()) return;

      const reviewText = `Review for ${data.product_name || asin}: ${review.title || ''} - ${review.text}. Rating: ${review.rating}/5`;

      chunks.push({
        id: `${asin}_review_${idx}`,
        text: reviewText,
        metadata: {
          asin,
          chunk_type: 'review',
          product_name: data.product_name,
          brand: data.brand,
          rating: review.rating || 0,
          helpful_votes: review.helpful_votes || 0
        }
      });
    });
  }

  console.log(`✅ Generated ${chunks.length} review chunks`);

  if (chunks.length === 0) {
    console.log('⚠️  No reviews to embed');
    return { count: 0, cost: 0 };
  }

  const embeddings = await generateEmbeddingsBatch(chunks, 'Reviews');
  await saveToLanceDB('reviews', chunks, embeddings);

  return { count: chunks.length, cost: calculateCost(chunks.map(c => c.text)) };
}

/**
 * Embed Insight Data
 */
async function embedInsights() {
  console.log('\n💡 Processing insight files...');

  const chunks = [];

  // Usage Context
  const usageContextPath = path.join(DATA_PATH, '..', '..', 'demo', 'm2_usage_context.json');
  if (fs.existsSync(usageContextPath)) {
    const usageData = JSON.parse(fs.readFileSync(usageContextPath, 'utf-8'));

    if (usageData.products && Array.isArray(usageData.products)) {
      usageData.products.forEach((product, pidx) => {
        if (!product.usage_contexts || !Array.isArray(product.usage_contexts)) return;

        product.usage_contexts.forEach((ctx, cidx) => {
          if (!ctx.context) return;

          const text = `${product.product || 'Product'} by ${product.brand || 'Unknown'} - Usage: ${ctx.context}. Sentiment: ${ctx.sentiment_score || 'N/A'}. Key phrases: ${ctx.key_phrases?.join(', ') || 'N/A'}. Season: ${ctx.season || 'N/A'}`;

          chunks.push({
            id: `usage_${pidx}_${cidx}`,
            text,
            metadata: {
              chunk_type: 'usage_context',
              product: product.product,
              brand: product.brand,
              asin: product.asin,
              sentiment: ctx.sentiment_score || 0,
              season: ctx.season || 'all',
              frequency: ctx.frequency || 0
            }
          });
        });
      });
    }
  }

  // Intelligence Bridge
  const intelligencePath = path.join(DATA_PATH, '..', '..', 'demo', 'm2_intelligence_bridge.json');
  if (fs.existsSync(intelligencePath)) {
    const intelligenceData = JSON.parse(fs.readFileSync(intelligencePath, 'utf-8'));

    if (intelligenceData.cross_brand_insights && Array.isArray(intelligenceData.cross_brand_insights)) {
      intelligenceData.cross_brand_insights.forEach((insight, idx) => {
        if (!insight.insight) return;

        chunks.push({
          id: `intelligence_${idx}`,
          text: `Market Insight: ${insight.theme || 'General'} - ${insight.insight}. Opportunity: ${insight.opportunity || 'N/A'}`,
          metadata: {
            chunk_type: 'intelligence',
            theme: insight.theme,
            affected_brands: insight.affected_brands?.join(', ') || '',
            market_size: insight.market_size || 'N/A'
          }
        });
      });
    }
  }

  console.log(`✅ Generated ${chunks.length} insight chunks`);

  if (chunks.length === 0) {
    console.log('⚠️  No insights to embed');
    return { count: 0, cost: 0 };
  }

  const embeddings = await generateEmbeddingsBatch(chunks, 'Insights');
  await saveToLanceDB('insights', chunks, embeddings);

  return { count: chunks.length, cost: calculateCost(chunks.map(c => c.text)) };
}

/**
 * Generate embeddings in batches
 */
async function generateEmbeddingsBatch(chunks, label = 'Data') {
  const batchSize = 128; // Voyage AI max batch size
  const embeddings = [];

  console.log(`\n🔄 Generating embeddings for ${chunks.length} ${label} chunks...`);

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(chunks.length / batchSize);

    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

    try {
      const result = await voyage.embed({
        input: batch.map(c => c.text),
        model: 'voyage-3',
        inputType: 'document' // for storage/retrieval
      });

      // Debug: Check response structure
      if (!result) {
        throw new Error('API returned null/undefined result');
      }

      // Handle different response formats
      const embeddingData = result.embeddings || result.data || result;

      if (!embeddingData || !Array.isArray(embeddingData)) {
        console.error('Unexpected API response structure:', JSON.stringify(result).substring(0, 200));
        throw new Error(`Invalid embeddings format. Got: ${typeof embeddingData}`);
      }

      embeddings.push(...embeddingData);

      // Rate limiting: wait 1 second between batches
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error in batch ${batchNum}:`, error.message);
      throw error;
    }
  }

  console.log(`✅ Generated ${embeddings.length} embeddings`);
  return embeddings;
}

/**
 * Save to LanceDB
 */
async function saveToLanceDB(tableName, chunks, embeddings) {
  console.log(`\n💾 Saving to LanceDB table: ${tableName}...`);

  // Create DB directory if not exists
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }

  const db = await connect(DB_PATH);

  // Debug: Check embedding format
  console.log(`  Debug - First embedding type: ${typeof embeddings[0]}`);
  console.log(`  Debug - Is array: ${Array.isArray(embeddings[0])}`);
  if (embeddings[0]) {
    console.log(`  Debug - Embedding keys: ${Object.keys(embeddings[0])}`);
    console.log(`  Debug - Full structure: ${JSON.stringify(embeddings[0]).substring(0, 200)}`);
  }

  const records = chunks.map((chunk, idx) => {
    const embedding = embeddings[idx];

    // Ensure vector is an array
    const vectorArray = Array.isArray(embedding) ? embedding :
                       Array.isArray(embedding?.embedding) ? embedding.embedding :
                       Object.values(embedding || {});

    return {
      id: chunk.id,
      vector: vectorArray,
      text: chunk.text,
      metadata: JSON.stringify(chunk.metadata)
    };
  });

  try {
    await db.createTable(tableName, records, { mode: 'overwrite' });
    console.log(`✅ Saved ${records.length} records to ${tableName} table`);
  } catch (error) {
    console.error(`❌ Error saving to LanceDB:`, error.message);
    console.error(`  First record vector type: ${typeof records[0]?.vector}`);
    console.error(`  First record vector is array: ${Array.isArray(records[0]?.vector)}`);
    throw error;
  }
}

/**
 * Create overlapping text chunks
 */
function createOverlappingChunks(text, chunkSize, overlap) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;

    if (end === text.length) break;
  }

  return chunks;
}

/**
 * Calculate embedding cost
 */
function calculateCost(texts) {
  const totalTokens = texts.reduce((sum, text) => {
    // Rough estimate: 1 token ≈ 4 characters
    return sum + Math.ceil(text.length / 4);
  }, 0);

  const costPerMillion = 0.12; // Voyage-3 pricing
  const cost = (totalTokens / 1_000_000) * costPerMillion;

  return {
    tokens: totalTokens,
    cost: cost.toFixed(4)
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting RAG Embedding Generation\n');
  console.log('━'.repeat(50));

  // Check API key
  if (!process.env.VOYAGE_API_KEY || process.env.VOYAGE_API_KEY === 'your_voyage_api_key_here') {
    console.error('❌ VOYAGE_API_KEY not set in .env.local');
    console.error('Please get your API key from https://voyageai.com');
    process.exit(1);
  }

  try {
    const startTime = Date.now();

    const results = {
      products: await embedProducts(),
      reviews: await embedReviews(),
      insights: await embedInsights()
    };

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '━'.repeat(50));
    console.log('📊 Summary:\n');
    console.log(`Products:  ${results.products.count} chunks, $${results.products.cost}`);
    console.log(`Reviews:   ${results.reviews.count} chunks, $${results.reviews.cost}`);
    console.log(`Insights:  ${results.insights.count} chunks, $${results.insights.cost}`);
    console.log('');

    const totalCount = results.products.count + results.reviews.count + results.insights.count;
    const totalCost = parseFloat(results.products.cost) + parseFloat(results.reviews.cost) + parseFloat(results.insights.cost);

    console.log(`Total embeddings: ${totalCount}`);
    console.log(`Total cost: $${totalCost.toFixed(4)}`);
    console.log(`Duration: ${duration}s`);
    console.log('');
    console.log('✅ All embeddings generated successfully!');
    console.log(`📁 Data saved to: ${DB_PATH}`);
    console.log('');
    console.log('Next step: Run `npm run upload:lancedb` to upload to Vercel Blob');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
