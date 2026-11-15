/**
 * HuggingFace AI Service
 * Optional advanced analysis using HuggingFace API
 * Includes intelligent fallback mechanism
 */

import axios from 'axios';

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.timeout = 10000; // 10 second timeout
  }

  /**
   * Get AI-powered answer analysis
   * Falls back gracefully if API fails
   */
  async getAdvancedAnalysis(question, answer) {
    // If no API key, return null (will use local analysis)
    if (!this.apiKey) {
      return null;
    }

    try {
      // Use zero-shot classification for relevance
      const relevanceAnalysis = await this._analyzeRelevance(question, answer);
      
      // Use summarization for key points
      const keyPoints = await this._extractKeyPoints(answer);

      return {
        relevanceScore: relevanceAnalysis?.score || null,
        keyPoints: keyPoints || [],
        analyzed: true,
      };
    } catch (error) {
      console.warn(`HuggingFace API failed: ${error.message}. Using local analysis fallback.`);
      // Return null on failure - system will use local analysis
      return null;
    }
  }

  /**
   * Analyze answer relevance to question using zero-shot classification
   * @private
   */
  async _analyzeRelevance(question, answer) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/facebook/bart-large-mnli`,
        {
          inputs: answer,
          parameters: {
            candidate_labels: ['directly addresses the question', 'partially relevant', 'not relevant'],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      if (response.data?.scores) {
        const maxScore = Math.max(...response.data.scores);
        return {
          score: Math.round(maxScore * 100),
          label: response.data.labels[response.data.scores.indexOf(maxScore)],
        };
      }

      return null;
    } catch (error) {
      console.warn(`Relevance analysis failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract key points from answer using summarization
   * @private
   */
  async _extractKeyPoints(answer) {
    try {
      // Limit input size for API
      const truncatedAnswer = answer.substring(0, 512);

      const response = await axios.post(
        `${this.baseUrl}/facebook/bart-large-cnn`,
        {
          inputs: truncatedAnswer,
          parameters: {
            max_length: 150,
            min_length: 30,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      if (response.data?.[0]?.summary_text) {
        // Extract sentences as key points
        const summary = response.data[0].summary_text;
        return summary
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .slice(0, 3); // Limit to 3 key points
      }

      return [];
    } catch (error) {
      console.warn(`Key points extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        status: 'unconfigured',
        message: 'HuggingFace API key not set',
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/facebook/bart-large-mnli`,
        {
          inputs: 'Test message',
          parameters: {
            candidate_labels: ['positive', 'negative'],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      return {
        status: 'connected',
        message: 'HuggingFace API is accessible',
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `Connection failed: ${error.message}`,
      };
    }
  }
}

export default new HuggingFaceService();
