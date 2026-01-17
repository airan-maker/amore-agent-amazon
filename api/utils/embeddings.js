/**
 * Embedding Generation Utility
 * Generates embeddings using Voyage AI with caching
 */

import { VoyageAIClient } from 'voyageai';

// Initialize Voyage AI client
const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY
});

// Simple in-memory cache (for development)
// In production, use Vercel KV (Redis)
const embeddingCache = new Map();

/**
 * Generate embedding for a single text
 * With optional caching
 */
export async function generateEmbedding(text, useCache = true) {
  // Check cache first
  if (useCache) {
    const cacheKey = hashText(text);
    if (embeddingCache.has(cacheKey)) {
      console.log('✅ Cache hit for embedding');
      return embeddingCache.get(cacheKey);
    }
  }

  try {
    // Generate embedding
    const result = await voyage.embed({
      input: [text],
      model: 'voyage-3',
      inputType: 'query' // for search queries
    });

    const embedding = result.embeddings[0];

    // Cache it
    if (useCache) {
      const cacheKey = hashText(text);
      embeddingCache.set(cacheKey, embedding);

      // Limit cache size (LRU-like behavior)
      if (embeddingCache.size > 1000) {
        const firstKey = embeddingCache.keys().next().value;
        embeddingCache.delete(firstKey);
      }
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddingsBatch(texts, inputType = 'query') {
  try {
    const result = await voyage.embed({
      input: texts,
      model: 'voyage-3',
      inputType
    });

    return result.embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error.message);
    throw error;
  }
}

/**
 * Simple hash function for cache keys
 */
function hashText(text) {
  return text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0).toString(36);
}

/**
 * Get cache stats (for monitoring)
 */
export function getCacheStats() {
  return {
    size: embeddingCache.size,
    maxSize: 1000
  };
}

/**
 * Clear cache (for testing)
 */
export function clearCache() {
  embeddingCache.clear();
  console.log('🗑️  Embedding cache cleared');
}
