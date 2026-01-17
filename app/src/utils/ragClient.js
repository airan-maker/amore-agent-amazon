/**
 * RAG Client
 * Frontend client for interacting with RAG API endpoints
 */

export class RAGClient {
  constructor(apiBaseUrl = '') {
    this.baseUrl = apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '';
  }

  /**
   * Ask a question using RAG
   */
  async askQuestion(question, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question,
          topK: options.topK || 5,
          filters: options.filters || {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'RAG API returned unsuccessful response');
      }

      return {
        success: true,
        answer: {
          type: 'rag',
          fullText: data.answer,
          sources: data.sources || [],
          usage: data.usage,
          metadata: data.metadata
        }
      };

    } catch (error) {
      console.error('RAG Client Error:', error);
      return {
        success: false,
        error: `RAG 시스템 오류: ${error.message}`
      };
    }
  }

  /**
   * Search for relevant documents
   */
  async search(query, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          topK: options.topK || 10,
          collections: options.collections || ['products', 'reviews', 'insights'],
          filters: options.filters || {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Search API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success,
        results: data.results || [],
        count: data.count || 0,
        error: data.error
      };

    } catch (error) {
      console.error('Search Error:', error);
      return {
        success: false,
        results: [],
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * Check if RAG system is available
   */
  async healthCheck() {
    try {
      // Try a simple test query
      const result = await this.askQuestion('test', { topK: 1 });
      return result.success;
    } catch (error) {
      console.error('RAG Health Check Failed:', error);
      return false;
    }
  }
}
