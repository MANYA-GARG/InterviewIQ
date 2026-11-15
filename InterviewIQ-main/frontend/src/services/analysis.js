/**
 * Analysis API Service
 * Frontend service for calling analysis endpoints
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AnalysisService {
  /**
   * Analyze a single answer
   */
  async analyzeSingleAnswer(answerId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/analysis/answer/${answerId}`
      );
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Quick analyze without database
   */
  async quickAnalyze(question, answer, expectedAnswer = '') {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/analysis/quick`,
        {
          question,
          answer,
          expectedAnswer,
        }
      );
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Analyze entire interview
   */
  async analyzeInterview(interviewId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/analysis/interview/${interviewId}`
      );
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Batch analyze multiple answers
   */
  async batchAnalyzeAnswers(answerIds) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/analysis/batch`,
        { answerIds }
      );
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Regenerate analysis
   */
  async regenerateAnalysis(answerId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/analysis/regenerate/${answerId}`
      );
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Export analysis
   */
  async exportAnalysis(answerId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analysis/export/${answerId}`
      );
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get analysis system status
   */
  async getAnalysisStatus() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analysis/status`
      );
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Error handler
   */
  _handleError(error) {
    const message = error.response?.data?.message || error.message || 'Analysis failed';
    const status = error.response?.status;

    return {
      success: false,
      message,
      status,
      data: error.response?.data,
    };
  }
}

export default new AnalysisService();
