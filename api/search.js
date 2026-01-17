/**
 * Vector Search API
 * Standalone vector search endpoint (without LLM generation)
 */

import { getLanceDB } from './utils/lancedb.js';
import { generateEmbedding } from './utils/embeddings.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    query,
    topK = 10,
    collections = ['products', 'reviews', 'insights'],
    filters = {}
  } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Query is required'
    });
  }

  try {
    console.log(`\n🔍 Search query: ${query}`);

    // Generate query embedding
    const embedding = await generateEmbedding(query);

    // Search in specified collections
    const db = await getLanceDB();
    const searchPromises = collections.map(async (collectionName) => {
      try {
        const table = await db.openTable(collectionName);
        let searchQuery = table.search(embedding).limit(topK);

        // Apply filters if provided
        if (Object.keys(filters).length > 0) {
          const filterStrings = Object.entries(filters).map(([key, value]) => {
            if (typeof value === 'string') {
              return `${key} = '${value}'`;
            }
            return `${key} = ${value}`;
          });

          if (filterStrings.length > 0) {
            searchQuery = searchQuery.where(filterStrings.join(' AND '));
          }
        }

        const results = await searchQuery.execute();
        return results.map(r => ({
          ...r,
          collection: collectionName
        }));
      } catch (err) {
        console.warn(`Search in ${collectionName} failed:`, err.message);
        return [];
      }
    });

    const resultsArrays = await Promise.all(searchPromises);

    // Flatten and sort by relevance
    const allResults = resultsArrays
      .flat()
      .sort((a, b) => a.distance - b.distance);

    console.log(`  Found ${allResults.length} results`);

    // Format results
    const formattedResults = allResults.map(r => {
      const meta = JSON.parse(r.metadata);
      return {
        id: r.id,
        text: r.text,
        relevance: (1 - r.distance).toFixed(3),
        collection: r.collection,
        metadata: meta
      };
    });

    res.status(200).json({
      success: true,
      results: formattedResults,
      count: formattedResults.length,
      query
    });

  } catch (error) {
    console.error('❌ Search Error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
