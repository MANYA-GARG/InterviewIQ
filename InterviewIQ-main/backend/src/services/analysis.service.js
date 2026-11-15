/**
 * Unified Analysis Service
 * Orchestrates local NLP analysis with optional HuggingFace AI enhancement
 */

import answerAnalysisService from './answerAnalysis.service.js';
import huggingFaceService from './huggingFace.service.js';
import Answer from '../models/Answer.js';
import Question from '../models/Question.js';

class AnalysisService {
  /**
   * Complete answer analysis pipeline
   * Combines local scoring with optional AI analysis
   */
  async analyzeAnswerComprehensive(answerId, questionId) {
    try {
      // Fetch answer and question from database
      const answer = await Answer.findById(answerId);
      const question = await Question.findById(questionId);

      if (!answer || !question) {
        throw new Error('Answer or question not found');
      }

      const answerText = answer.transcript || answer.answerText || '';
      const questionText = question.questionText;
      const expectedAnswer = question.expectedAnswer || '';

      if (!answerText) {
        throw new Error('No answer text found');
      }

      // Local NLP analysis (always runs)
      const localAnalysis = await answerAnalysisService.analyzeAnswer(
        questionText,
        answerText,
        expectedAnswer
      );

      // Optional AI analysis with fallback
      let aiAnalysis = null;
      if (huggingFaceService.isConfigured()) {
        aiAnalysis = await huggingFaceService.getAdvancedAnalysis(
          questionText,
          answerText
        );
      }

      // Combine results
      return {
        answerId,
        questionId,
        localAnalysis: localAnalysis.localAnalysis,
        aiAnalysis: aiAnalysis || {
          analyzed: false,
          message: 'AI analysis not available - using local analysis only',
        },
        finalScore: localAnalysis.finalScore,
        strengths: localAnalysis.strengths,
        improvements: localAnalysis.improvements,
        analysisTimestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Comprehensive analysis failed: ${error.message}`);
    }
  }

  /**
   * Batch analyze multiple answers
   */
  async analyzeMultipleAnswers(answerIds) {
    const results = [];
    const errors = [];

    for (const answerId of answerIds) {
      try {
        const answer = await Answer.findById(answerId);
        if (!answer) {
          errors.push({ answerId, error: 'Answer not found' });
          continue;
        }

        const question = await Question.findById(answer.question);
        if (!question) {
          errors.push({ answerId, error: 'Question not found' });
          continue;
        }

        const analysis = await this.analyzeAnswerComprehensive(answerId, answer.question);
        results.push({
          answerId,
          analysis,
          status: 'success',
        });
      } catch (error) {
        errors.push({
          answerId,
          error: error.message,
        });
      }
    }

    return {
      analyzed: results,
      errors,
      summary: {
        total: answerIds.length,
        successful: results.length,
        failed: errors.length,
      },
    };
  }

  /**
   * Calculate interview-level scores from individual answers
   */
  async calculateInterviewScore(analysisList) {
    if (!analysisList || analysisList.length === 0) {
      throw new Error('No analysis data provided');
    }

    const scores = analysisList.map(a => a.finalScore);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Aggregate strengths and improvements
    const allStrengths = analysisList.flatMap(a => a.strengths);
    const allImprovements = analysisList.flatMap(a => a.improvements);

    const uniqueStrengths = [...new Set(allStrengths)];
    const uniqueImprovements = [...new Set(allImprovements)];

    return {
      averageScore,
      highestScore,
      lowestScore,
      questionsAnalyzed: analysisList.length,
      overallStrengths: uniqueStrengths.slice(0, 5),
      overallImprovements: uniqueImprovements.slice(0, 5),
      confidenceLevel: this._calculateConfidenceLevel(averageScore),
    };
  }

  /**
   * Determine confidence level based on score
   */
  _calculateConfidenceLevel(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 65) return 'Satisfactory';
    if (score >= 50) return 'Adequate';
    return 'Needs Improvement';
  }

  /**
   * Generate detailed feedback report
   */
  generateFeedbackReport(analysisData) {
    const { finalScore, localAnalysis, strengths, improvements } = analysisData;

    return {
      summary: {
        score: finalScore,
        level: this._calculateConfidenceLevel(finalScore),
        performanceCategory: this._categorizePerformance(finalScore),
      },
      breakdown: {
        keywordRelevance: {
          score: localAnalysis.keywordScore,
          status: this._getStatus(localAnalysis.keywordScore),
          description: 'How well your answer aligns with the question',
        },
        answerStructure: {
          score: localAnalysis.structureScore,
          status: this._getStatus(localAnalysis.structureScore),
          description: 'Organization and logical flow of your answer',
        },
        confidence: {
          score: localAnalysis.confidenceScore,
          status: this._getStatus(localAnalysis.confidenceScore),
          description: 'Strength of language and assertiveness',
        },
        sentiment: {
          score: localAnalysis.sentimentScore,
          status: this._getStatus(localAnalysis.sentimentScore),
          description: 'Positivity and constructiveness of tone',
        },
        answerLength: {
          score: localAnalysis.lengthScore,
          status: this._getStatus(localAnalysis.lengthScore),
          description: 'Adequacy of detail and explanation',
        },
      },
      features: {
        wordCount: localAnalysis.wordCount,
        hasStarFormat: localAnalysis.hasStar,
      },
      highlights: {
        strengths,
        improvements,
      },
      recommendations: this._generateRecommendations(finalScore, localAnalysis),
    };
  }

  /**
   * Get status label for score
   */
  _getStatus(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  }

  /**
   * Categorize performance
   */
  _categorizePerformance(score) {
    if (score >= 85) return 'Outstanding';
    if (score >= 75) return 'Strong';
    if (score >= 65) return 'Competent';
    if (score >= 50) return 'Developing';
    return 'Struggling';
  }

  /**
   * Generate actionable recommendations
   */
  _generateRecommendations(finalScore, localAnalysis) {
    const recommendations = [];

    if (localAnalysis.keywordScore < 60) {
      recommendations.push({
        priority: 'High',
        action: 'Reread the question carefully and ensure your answer directly addresses it',
        tip: 'Highlight key terms in the question and explicitly reference them in your answer',
      });
    }

    if (localAnalysis.confidenceScore < 60) {
      recommendations.push({
        priority: 'High',
        action: 'Replace uncertain language with definitive statements',
        tip: 'Instead of "I think" or "maybe", use "I", "We", or past tense like "I implemented"',
      });
    }

    if (localAnalysis.lengthScore < 50) {
      recommendations.push({
        priority: 'Medium',
        action: 'Provide more specific examples and details in your answer',
        tip: 'Use STAR method: explain the Situation, Task, Action, and Result',
      });
    }

    if (localAnalysis.structureScore < 60) {
      recommendations.push({
        priority: 'Medium',
        action: 'Organize your answer with clear beginning, middle, and end',
        tip: 'Use transitional words like "firstly", "therefore", "as a result"',
      });
    }

    if (finalScore >= 80) {
      recommendations.push({
        priority: 'Low',
        action: 'Continue this excellent work',
        tip: 'Your answer demonstrates strong understanding and communication skills',
      });
    }

    return recommendations.slice(0, 4); // Limit to 4 recommendations
  }
}

export default new AnalysisService();
