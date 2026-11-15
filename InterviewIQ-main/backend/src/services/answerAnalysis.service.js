/**
 * Answer Analysis Service
 * Pure JavaScript NLP-based scoring logic for interview answers
 * 
 * Scoring Formula:
 * Final Score = (KeywordScore * 0.3) + (StructureScore * 0.2) + 
 *               (ConfidenceScore * 0.2) + (SentimentScore * 0.1) + 
 *               (LengthScore * 0.2)
 */

class AnswerAnalysisService {
  /**
   * Analyze answer against question
   * @param {string} question - Interview question
   * @param {string} answer - User's answer
   * @param {string} expectedAnswer - Expected/ideal answer (optional)
   * @returns {Object} Analysis result with scores and insights
   */
  async analyzeAnswer(question, answer, expectedAnswer = '') {
    try {
      // Input validation
      if (!question || !answer) {
        throw new Error('Question and answer are required');
      }

      // Convert to lowercase for analysis
      const cleanQuestion = this._cleanText(question);
      const cleanAnswer = this._cleanText(answer);
      const cleanExpected = expectedAnswer ? this._cleanText(expectedAnswer) : '';

      // Calculate individual scores
      const keywordScore = this._calculateKeywordScore(cleanQuestion, cleanAnswer);
      const structureScore = this._calculateStructureScore(cleanAnswer);
      const confidenceScore = this._calculateConfidenceScore(cleanAnswer);
      const sentimentScore = this._calculateSentimentScore(cleanAnswer);
      const lengthScore = this._calculateLengthScore(cleanAnswer, cleanQuestion);

      // Calculate final weighted score
      const finalScore = Math.round(
        (keywordScore * 0.3) +
        (structureScore * 0.2) +
        (confidenceScore * 0.2) +
        (sentimentScore * 0.1) +
        (lengthScore * 0.2)
      );

      // Generate insights
      const strengths = this._identifyStrengths({
        keywordScore,
        structureScore,
        confidenceScore,
        sentimentScore,
        lengthScore,
      });

      const improvements = this._identifyImprovements({
        keywordScore,
        structureScore,
        confidenceScore,
        sentimentScore,
        lengthScore,
        answer,
      });

      return {
        localAnalysis: {
          keywordScore,
          structureScore,
          confidenceScore,
          sentimentScore,
          lengthScore,
          wordCount: cleanAnswer.split(/\s+/).length,
          hasStar: this._detectStarFormat(cleanAnswer),
        },
        finalScore,
        strengths,
        improvements,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Answer analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate keyword relevance score (30%)
   * Matches question keywords with answer content
   */
  _calculateKeywordScore(question, answer) {
    const questionWords = this._extractKeywords(question);
    const answerWords = this._extractKeywords(answer);

    if (questionWords.length === 0) return 50; // Default if no keywords found

    const matches = questionWords.filter(word => answerWords.includes(word));
    const matchPercentage = (matches.length / questionWords.length) * 100;

    // Score: 0-100 based on keyword match percentage
    return Math.min(100, matchPercentage * 1.2);
  }

  /**
   * Calculate structure score (20%)
   * Evaluates answer organization and clarity
   */
  _calculateStructureScore(answer) {
    let score = 50; // Base score

    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Reward multiple sentences (well-structured answer)
    if (sentences.length >= 3) score += 20;
    else if (sentences.length >= 2) score += 10;

    // Reward proper sentence length (not too short, not too long)
    const avgSentenceLength = answer.length / Math.max(sentences.length, 1);
    if (avgSentenceLength >= 30 && avgSentenceLength <= 150) {
      score += 15;
    }

    // Reward transitional words (shows logical flow)
    const transitionalWords = ['therefore', 'however', 'moreover', 'furthermore', 'consequently', 'firstly', 'secondly'];
    const hasTransitional = transitionalWords.some(word => answer.includes(word));
    if (hasTransitional) score += 15;

    return Math.min(100, score);
  }

  /**
   * Calculate confidence score (20%)
   * Detects strong vs weak language
   */
  _calculateConfidenceScore(answer) {
    let score = 50; // Base score
    
    // Strong confidence words and phrases
    const strongWords = [
      'definitely', 'certainly', 'absolutely', 'proven', 'clear', 'established',
      'successfully', 'accomplished', 'achieved', 'resolved', 'solved', 'implemented',
      'completed', 'delivered', 'master', 'expert', 'confident', 'expertise'
    ];

    // Weak confidence words
    const weakWords = [
      'maybe', 'perhaps', 'might', 'could', 'somewhat', 'probably', 'possibly',
      'i think', 'i believe', 'supposedly', 'allegedly', 'uncertain', 'unclear',
      'sort of', 'kind of', 'a bit', 'quite', 'rather'
    ];

    // Count occurrences
    const strongCount = strongWords.filter(word => answer.includes(word)).length;
    const weakCount = weakWords.filter(word => answer.includes(word)).length;

    score += (strongCount * 10) - (weakCount * 8);

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate sentiment score (10%)
   * Basic sentiment analysis (positive vs negative language)
   */
  _calculateSentimentScore(answer) {
    let score = 50; // Neutral base
    
    // Positive sentiment words
    const positiveWords = [
      'excellent', 'great', 'good', 'amazing', 'wonderful', 'fantastic', 'awesome',
      'proud', 'successful', 'effective', 'efficient', 'valuable', 'beneficial',
      'enjoyed', 'learned', 'improved', 'growth', 'positive'
    ];

    // Negative sentiment words
    const negativeWords = [
      'bad', 'poor', 'failed', 'wrong', 'terrible', 'awful', 'horrible', 'difficult',
      'struggle', 'lost', 'mistake', 'error', 'problem', 'issue', 'negative', 'hate'
    ];

    const positiveCount = positiveWords.filter(word => answer.includes(word)).length;
    const negativeCount = negativeWords.filter(word => answer.includes(word)).length;

    score += (positiveCount * 8) - (negativeCount * 5);

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate length score (20%)
   * Evaluates if answer is adequately detailed
   */
  _calculateLengthScore(answer, question) {
    const answerWordCount = answer.split(/\s+/).length;
    const questionWordCount = question.split(/\s+/).length;

    let score = 0;

    // Ideal answer is 3-5x longer than question
    const ratio = answerWordCount / Math.max(questionWordCount, 1);

    if (ratio < 0.5) {
      score = 20; // Too short, minimal effort
    } else if (ratio >= 0.5 && ratio < 1) {
      score = 40; // Still below ideal
    } else if (ratio >= 1 && ratio < 3) {
      score = 70; // Good length
    } else if (ratio >= 3 && ratio < 8) {
      score = 95; // Excellent detail
    } else {
      score = 60; // Too long, may be rambling
    }

    return score;
  }

  /**
   * Detect STAR format (Situation, Task, Action, Result)
   */
  _detectStarFormat(answer) {
    const starIndicators = {
      situation: /(situation|scenario|context|background|setting)/i,
      task: /(task|responsibility|challenge|objective|goal)/i,
      action: /(action|did|implemented|developed|created|built|designed)/i,
      result: /(result|outcome|impact|achieved|learned|concluded)/i,
    };

    const detected = {};
    for (const [key, regex] of Object.entries(starIndicators)) {
      detected[key] = regex.test(answer);
    }

    return detected;
  }

  /**
   * Identify strengths based on scores
   */
  _identifyStrengths(scores) {
    const strengths = [];

    if (scores.keywordScore >= 70) {
      strengths.push('Strong keyword alignment with the question');
    }

    if (scores.structureScore >= 70) {
      strengths.push('Well-organized and structured response');
    }

    if (scores.confidenceScore >= 70) {
      strengths.push('Confident language and assertive tone');
    }

    if (scores.sentimentScore >= 70) {
      strengths.push('Positive language and constructive approach');
    }

    if (scores.lengthScore >= 80) {
      strengths.push('Adequate detail and thorough explanation');
    }

    if (strengths.length === 0) {
      strengths.push('Clear communication demonstrated');
    }

    return strengths;
  }

  /**
   * Identify areas for improvement
   */
  _identifyImprovements(scores) {
    const improvements = [];

    if (scores.keywordScore < 60) {
      improvements.push('Address the question more directly with relevant keywords');
    }

    if (scores.structureScore < 60) {
      improvements.push('Organize your answer with clear, logical flow');
    }

    if (scores.confidenceScore < 60) {
      improvements.push('Use more assertive language and avoid uncertain phrases');
    }

    if (scores.sentimentScore < 60) {
      improvements.push('Frame challenges positively and focus on learning outcomes');
    }

    if (scores.lengthScore < 50) {
      improvements.push('Provide more detailed explanation with specific examples');
    }

    if (scores.lengthScore > 85) {
      improvements.push('Be more concise - consider reducing unnecessary details');
    }

    if (improvements.length === 0) {
      improvements.push('Continue maintaining this high quality in future responses');
    }

    return improvements;
  }

  /**
   * Clean text for analysis
   */
  _cleanText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  /**
   * Extract important keywords from text
   */
  _extractKeywords(text) {
    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'what',
      'which', 'who', 'where', 'when', 'why', 'how', 'all', 'each', 'every',
      'as', 'if', 'so', 'than', 'up', 'after', 'before', 'between', 'into',
      'about', 'during', 'through', 'during', 'my', 'your', 'his', 'her', 'its'
    ]);

    return text
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }
}

export default new AnswerAnalysisService();
