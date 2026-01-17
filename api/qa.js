/**
 * RAG-based Q&A API
 * Main endpoint for question answering using Retrieval-Augmented Generation
 */

import Anthropic from '@anthropic-ai/sdk';
import { getLanceDB } from './utils/lancedb.js';
import { generateEmbedding } from './utils/embeddings.js';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader(corsHeaders).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, topK = 5, filters = {} } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Question is required'
    });
  }

  try {
    console.log(`\n📝 Question: ${question}`);

    // Step 1: Generate question embedding
    console.log('🔄 Generating query embedding...');
    const queryEmbedding = await generateEmbedding(question);

    // Step 2: Vector search across collections
    console.log('🔍 Searching vector database...');
    const db = await getLanceDB();

    const [productResults, reviewResults, insightResults] = await Promise.all([
      db.openTable('products')
        .search(queryEmbedding)
        .limit(topK)
        .execute()
        .catch(err => {
          console.warn('Products table search failed:', err.message);
          return [];
        }),
      db.openTable('reviews')
        .search(queryEmbedding)
        .limit(Math.floor(topK / 2))
        .execute()
        .catch(err => {
          console.warn('Reviews table search failed:', err.message);
          return [];
        }),
      db.openTable('insights')
        .search(queryEmbedding)
        .limit(Math.floor(topK / 2))
        .execute()
        .catch(err => {
          console.warn('Insights table search failed:', err.message);
          return [];
        })
    ]);

    // Merge and sort by relevance (distance)
    const allResults = [...productResults, ...reviewResults, ...insightResults]
      .sort((a, b) => a.distance - b.distance)
      .slice(0, topK);

    if (allResults.length === 0) {
      return res.status(200).json({
        success: true,
        answer: '검색된 관련 문서가 없습니다. 다른 질문을 시도해보세요.',
        sources: [],
        usage: null
      });
    }

    console.log(`  Found ${allResults.length} relevant documents`);

    // Step 3: Build context from retrieved documents
    const contextText = allResults.map((doc, i) => {
      const meta = JSON.parse(doc.metadata);
      return `[Document ${i + 1}] (Type: ${meta.chunk_type})
${doc.text}
`;
    }).join('\n');

    // Step 4: Generate answer with Claude
    console.log('🤖 Generating answer with Claude...');

    const systemPrompt = `당신은 아마존 마켓플레이스 데이터 분석 전문가입니다.
다음 검색된 문서들을 기반으로 사용자의 질문에 답변해주세요.

## 검색된 관련 문서:
${contextText}

## 답변 지침:
1. **검색된 문서의 정보만 사용**하여 답변하세요
2. 구체적인 수치, 제품명, 브랜드명을 포함하세요
3. 출처를 명시하세요 (예: [Document 1] 참조)
4. 정보가 불충분하면 솔직하게 언급하세요
5. 한국어로 전문적이고 명확하게 답변하세요
6. 불렛 포인트를 적극 사용하여 가독성을 높이세요`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: question
      }]
    });

    const answer = message.content[0].text;

    // Step 5: Prepare response with sources
    const sources = allResults.map(d => {
      const meta = JSON.parse(d.metadata);
      return {
        type: meta.chunk_type,
        product: meta.product_name || meta.product || meta.asin || 'Unknown',
        brand: meta.brand || 'Unknown',
        relevance: (1 - d.distance).toFixed(3), // Higher is more relevant
        asin: meta.asin
      };
    });

    console.log('✅ Answer generated successfully');

    res.status(200).json({
      success: true,
      answer,
      sources,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        total_tokens: message.usage.input_tokens + message.usage.output_tokens
      },
      metadata: {
        retrieved_docs: allResults.length,
        model: message.model
      }
    });

  } catch (error) {
    console.error('❌ QA Error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
