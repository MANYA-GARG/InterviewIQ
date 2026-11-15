import Answer from '../models/Answer.js';
import Question from '../models/Question.js';
import Interview from '../models/Interview.js';
import AppError from '../utils/AppError.js';

class SmartScoringService {
  /**
   * Generate comprehensive evaluation report for completed interview
   */
  async generateEvaluationReport(interviewId) {
    try {
      const interview = await Interview.findById(interviewId)
        .populate('user', 'name email')
        .populate('resume');

      if (!interview) {
        throw new AppError('Interview not found', 404);
      }

      // Fetch all answers and questions for this interview
      const answers = await Answer.find({ interview: interviewId })
        .populate('question')
        .sort({ createdAt: 1 });

      if (answers.length === 0) {
        throw new AppError('No answers found for this interview', 400);
      }

      // Score each answer
      const answerScores = answers.map((answer) => ({
        questionId: answer.question._id,
        questionText: answer.question.questionText,
        category: answer.question.category,
        difficulty: answer.question.difficulty,
        answer: answer.answerText || answer.transcript,
        expectedAnswer: answer.question.expectedAnswer,
        timeTaken: answer.timeTaken,
        mode: answer.mode,
        scores: this._scoreAnswer(
          answer.answerText || answer.transcript,
          answer.question.questionText,
          answer.question.expectedAnswer,
          answer.question.category,
          interview.jobRole
        ),
      }));

      // Calculate category-wise performance
      const categoryScores = this._calculateCategoryScores(answerScores);

      // Calculate overall score
      const overallScore = this._calculateOverallScore(answerScores);

      // Identify strengths and improvements
      const { strengths, improvements } = this._identifyStrengthsAndImprovements(
        answerScores,
        categoryScores
      );

      // Calculate consistency score
      const consistencyScore = this._calculateConsistencyScore(answerScores);

      // Build evaluation report
      const evaluationReport = {
        generatedAt: new Date(),
        interview: {
          jobRole: interview.jobRole,
          experienceLevel: interview.experienceLevel,
          totalQuestions: answers.length,
          mode: interview.mode,
          duration: interview.timerDuration,
        },
        overallAssessment: {
          score: overallScore,
          grade: this._getGrade(overallScore),
          performanceLevel: this._getPerformanceLevel(overallScore),
          consistency: consistencyScore,
        },
        categoryScores,
        answerBreakdown: answerScores.map((ans) => ({
          questionNumber: answerScores.indexOf(ans) + 1,
          category: ans.category,
          difficulty: ans.difficulty,
          timeTaken: ans.timeTaken,
          score: ans.scores.finalScore,
          breakdown: {
            keywordRelevance: ans.scores.keywordScore,
            contentQuality: ans.scores.contentScore,
            confidence: ans.scores.confidenceScore,
            structure: ans.scores.structureScore,
            sentiment: ans.scores.sentimentScore,
          },
          starFormat: ans.scores.starDetected,
          feedback: ans.scores.feedback,
        })),
        strengths,
        improvements,
        recommendation: this._generateRecommendation(overallScore, improvements),
      };

      return evaluationReport;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Score individual answer based on multiple factors
   */
  _scoreAnswer(answerText, questionText, expectedAnswer, category, jobRole) {
    if (!answerText || answerText.trim().length === 0) {
      return {
        keywordScore: 0,
        contentScore: 0,
        confidenceScore: 0,
        structureScore: 0,
        sentimentScore: 0,
        starDetected: false,
        finalScore: 0,
        feedback: 'No answer provided',
      };
    }

    const keywordScore = this._scoreKeywordRelevance(
      answerText,
      questionText,
      expectedAnswer,
      jobRole
    );
    const contentScore = this._scoreContentQuality(answerText, questionText, category);
    const confidenceScore = this._scoreConfidenceLevel(answerText);
    const structureScore = this._scoreAnswerStructure(answerText);
    const sentimentScore = this._scoreSentiment(answerText);
    const starDetected = this._detectStarFormat(answerText);

    // Weighted calculation
    const finalScore =
      keywordScore * 0.25 +
      contentScore * 0.25 +
      confidenceScore * 0.2 +
      structureScore * 0.15 +
      sentimentScore * 0.15;

    const feedback = this._generateAnswerFeedback(
      finalScore,
      keywordScore,
      contentScore,
      confidenceScore,
      starDetected
    );

    return {
      keywordScore: Math.round(keywordScore),
      contentScore: Math.round(contentScore),
      confidenceScore: Math.round(confidenceScore),
      structureScore: Math.round(structureScore),
      sentimentScore: Math.round(sentimentScore),
      starDetected,
      finalScore: Math.round(finalScore),
      feedback,
    };
  }

  /**
   * Score keyword relevance (0-100)
   */
  _scoreKeywordRelevance(answerText, questionText, expectedAnswer, jobRole) {
    const answerWords = this._extractKeywords(answerText);
    const questionKeywords = this._extractKeywords(questionText);
    const expectedKeywords = this._extractKeywords(expectedAnswer || '');
    const jobRoleKeywords = this._getJobRoleKeywords(jobRole);

    let matchCount = 0;
    let relevantKeywords = new Set();

    // Check answer against question keywords
    questionKeywords.forEach((kw) => {
      if (answerWords.has(kw)) {
        matchCount += 1;
        relevantKeywords.add(kw);
      }
    });

    // Check against expected answer keywords (higher weight)
    expectedKeywords.forEach((kw) => {
      if (answerWords.has(kw)) {
        matchCount += 2;
        relevantKeywords.add(kw);
      }
    });

    // Check for job role relevance
    jobRoleKeywords.forEach((kw) => {
      if (answerWords.has(kw)) {
        matchCount += 1;
        relevantKeywords.add(kw);
      }
    });

    const baseScore = Math.min(100, (matchCount / Math.max(1, questionKeywords.length)) * 100);
    const diversityBonus = Math.min(20, relevantKeywords.size * 3);

    return Math.min(100, baseScore + diversityBonus);
  }

  /**
   * Score content quality based on depth and relevance (0-100)
   */
  _scoreContentQuality(answerText, questionText, category) {
    const answer = answerText.toLowerCase();
    const wordCount = answerText.split(/\s+/).length;

    let score = 50; // Base score

    // Word count evaluation
    if (wordCount < 20) {
      score -= 25;
    } else if (wordCount < 50) {
      score -= 10;
    } else if (wordCount > 300) {
      score -= 5;
    } else {
      score += 15;
    }

    // Category-specific depth signals
    const depthSignals = {
      technical: ['algorithm', 'complexity', 'optimize', 'implement', 'architecture', 'design'],
      behavioral: ['experience', 'achieved', 'result', 'learned', 'challenge', 'situation'],
      situational: ['approach', 'decision', 'reason', 'context', 'outcome', 'specifically'],
    };

    const signals = depthSignals[category] || [];
    signals.forEach((signal) => {
      if (answer.includes(signal)) {
        score += 5;
      }
    });

    // Penalize irrelevant signals
    const badSignals = ['idk', 'dont know', 'not sure', 'guess', 'random', 'ummm', 'like'];
    badSignals.forEach((signal) => {
      if (answer.includes(signal)) {
        score -= 10;
      }
    });

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score confidence level based on language patterns (0-100)
   */
  _scoreConfidenceLevel(answerText) {
    const answer = answerText.toLowerCase();
    let score = 50; // Base score

    // Strong confidence indicators
    const strongWords = [
      'definitely',
      'certainly',
      'absolutely',
      'proven',
      'accomplished',
      'successfully',
      'clearly',
      'undoubtedly',
      'confident',
      'expertise',
    ];

    // Weak confidence indicators
    const weakWords = [
      'maybe',
      'probably',
      'possibly',
      'might',
      'sort of',
      'kind of',
      'somewhat',
      'unsure',
      'think',
      'perhaps',
    ];

    // Uncertain/hesitant words
    const uncertainWords = ['umm', 'uh', 'like', 'you know', 'basically', 'i think'];

    strongWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = answer.match(regex);
      if (matches) {
        score += Math.min(15, matches.length * 3);
      }
    });

    weakWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = answer.match(regex);
      if (matches) {
        score -= Math.min(20, matches.length * 2);
      }
    });

    uncertainWords.forEach((word) => {
      const regex = new RegExp(word, 'gi');
      const matches = answer.match(regex);
      if (matches) {
        score -= matches.length * 2;
      }
    });

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score answer structure and organization (0-100)
   */
  _scoreAnswerStructure(answerText) {
    const sentences = answerText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    let score = 50;

    // Sentence count (should be 3-7 for good structure)
    if (sentences.length < 2) {
      score -= 20;
    } else if (sentences.length >= 3 && sentences.length <= 7) {
      score += 20;
    } else if (sentences.length > 10) {
      score -= 10;
    }

    // Check for transitional/connecting words
    const transitions = ['therefore', 'moreover', 'however', 'additionally', 'consequently', 'furthermore', 'thus', 'hence', 'meanwhile', 'instead'];
    const transitionCount = transitions.filter((trans) =>
      answerText.toLowerCase().includes(trans)
    ).length;
    score += Math.min(15, transitionCount * 5);

    // Check for logical flow indicators
    const flowIndicators = ['first', 'second', 'finally', 'in conclusion', 'to summarize'];
    const flowCount = flowIndicators.filter((indicator) =>
      answerText.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(15, flowCount * 5);

    // Average sentence length (15-25 words is ideal)
    const avgSentenceLength = answerText.split(/\s+/).length / sentences.length;
    if (avgSentenceLength >= 12 && avgSentenceLength <= 30) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score sentiment and tone of answer (0-100)
   */
  _scoreSentiment(answerText) {
    const answer = answerText.toLowerCase();
    let score = 50;

    // Positive indicators
    const positiveWords = [
      'excellent',
      'great',
      'proud',
      'achieved',
      'success',
      'effective',
      'improved',
      'positive',
      'capable',
      'skilled',
      'professional',
      'innovative',
    ];

    // Negative indicators
    const negativeWords = [
      'failed',
      'bad',
      'terrible',
      'useless',
      'hate',
      'problem',
      'issue',
      'difficult',
      'impossible',
      'weak',
      'incompetent',
    ];

    positiveWords.forEach((word) => {
      if (answer.includes(word)) {
        score += 5;
      }
    });

    negativeWords.forEach((word) => {
      if (answer.includes(word)) {
        score -= 3;
      }
    });

    // Penalize excessive negativity
    const negativeCount = negativeWords.filter((word) => answer.includes(word)).length;
    if (negativeCount > 3) {
      score -= 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Detect STAR format (Situation, Task, Action, Result)
   */
  _detectStarFormat(answerText) {
    const answer = answerText.toLowerCase();

    const situationKeywords = [
      'situation',
      'context',
      'background',
      'was working',
      'faced',
      'encountered',
    ];
    const taskKeywords = ['task', 'responsibility', 'challenge', 'goal', 'objective', 'required'];
    const actionKeywords = ['action', 'did', 'implemented', 'approach', 'took', 'used'];
    const resultKeywords = ['result', 'outcome', 'achieved', 'learned', 'improved', 'success'];

    const hasSituation = situationKeywords.some((kw) => answer.includes(kw));
    const hasTask = taskKeywords.some((kw) => answer.includes(kw));
    const hasAction = actionKeywords.some((kw) => answer.includes(kw));
    const hasResult = resultKeywords.some((kw) => answer.includes(kw));

    return {
      complete: hasSituation && hasTask && hasAction && hasResult,
      situation: hasSituation,
      task: hasTask,
      action: hasAction,
      result: hasResult,
    };
  }

  /**
   * Extract keywords from text
   */
  _extractKeywords(text) {
    if (!text) return new Set();

    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'is',
      'was',
      'are',
      'were',
      'be',
      'been',
      'by',
      'as',
      'if',
      'with',
      'that',
      'this',
      'it',
      'from',
      'about',
      'can',
      'could',
      'don',
      'do',
      'does',
      'doing',
      'done',
      'did',
      'would',
      'should',
      'may',
      'might',
      'must',
      'will',
      'shall',
      'have',
      'has',
      'had',
      'having',
      'i',
      'you',
      'he',
      'she',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
      'my',
      'your',
      'his',
      'her',
      'our',
      'their',
    ]);

    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter(
        (word) =>
          word.length > 2 &&
          !stopWords.has(word) &&
          !/^\d+$/.test(word)
      );

    return new Set(words);
  }

  /**
   * Get job role specific keywords
   */
  _getJobRoleKeywords(jobRole) {
    const roleKeywords = {
      developer: ['code', 'programming', 'software', 'algorithm', 'debug', 'api'],
      designer: ['ui', 'ux', 'design', 'user', 'interface', 'visual'],
      manager: ['leadership', 'team', 'management', 'strategy', 'planning', 'communication'],
      analyst: ['data', 'analysis', 'insights', 'metrics', 'reporting', 'trends'],
      engineer: ['systems', 'architecture', 'scalability', 'performance', 'infrastructure'],
    };

    const lowerRole = jobRole.toLowerCase();
    for (const [role, keywords] of Object.entries(roleKeywords)) {
      if (lowerRole.includes(role)) {
        return new Set(keywords);
      }
    }

    return new Set();
  }

  /**
   * Calculate category-wise scores
   */
  _calculateCategoryScores(answerScores) {
    const categoryMap = {};

    answerScores.forEach((ans) => {
      if (!categoryMap[ans.category]) {
        categoryMap[ans.category] = [];
      }
      categoryMap[ans.category].push(ans.scores.finalScore);
    });

    const categoryScores = {};
    Object.entries(categoryMap).forEach(([category, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      categoryScores[category] = {
        score: Math.round(avg),
        totalQuestions: scores.length,
        performanceLevel: this._getPerformanceLevel(avg),
      };
    });

    return categoryScores;
  }

  /**
   * Calculate overall score
   */
  _calculateOverallScore(answerScores) {
    if (answerScores.length === 0) return 0;

    const totalScore = answerScores.reduce(
      (sum, ans) => sum + ans.scores.finalScore,
      0
    );

    return Math.round(totalScore / answerScores.length);
  }

  /**
   * Calculate consistency score across answers
   */
  _calculateConsistencyScore(answerScores) {
    if (answerScores.length < 2) return 100;

    const scores = answerScores.map((ans) => ans.scores.finalScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    // If stdDev is 0-10, score is 100; if 30+, score is 50
    const consistency = Math.max(50, 100 - stdDev * 1.5);

    return Math.round(consistency);
  }

  /**
   * Get performance grade (A, B, C, D, F)
   */
  _getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get performance level description
   */
  _getPerformanceLevel(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 65) return 'Satisfactory';
    if (score >= 55) return 'Adequate';
    return 'Needs Improvement';
  }

  /**
   * Identify strengths and improvements
   */
  _identifyStrengthsAndImprovements(answerScores, categoryScores) {
    const strengths = [];
    const improvements = [];

    // Find top performing categories
    Object.entries(categoryScores).forEach(([category, data]) => {
      if (data.score >= 80) {
        strengths.push(`Strong performance in ${category} questions (${data.score}/100)`);
      } else if (data.score < 60) {
        improvements.push(`Improve ${category} question responses (Currently ${data.score}/100)`);
      }
    });

    // Find high confidence speakers
    const confidenceScores = answerScores.map((ans) => ans.scores.confidenceScore);
    const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

    if (avgConfidence >= 75) {
      strengths.push('Excellent confidence in articulation');
    }

    // Find well-structured answers
    const structureScores = answerScores.map((ans) => ans.scores.structureScore);
    const avgStructure = structureScores.reduce((a, b) => a + b, 0) / structureScores.length;

    if (avgStructure >= 75) {
      strengths.push('Well-organized and coherent responses');
    } else if (avgStructure < 60) {
      improvements.push('Work on structuring answers more clearly and logically');
    }

    // Find STAR format usage
    const starCount = answerScores.filter((ans) => ans.scores.starDetected.complete).length;
    if (starCount / answerScores.length >= 0.5) {
      strengths.push('Good use of STAR format in behavioral questions');
    } else if (starCount === 0) {
      improvements.push('Practice using STAR format for behavioral questions');
    }

    // Ensure minimum items
    if (strengths.length === 0) {
      strengths.push('Shows capability to provide relevant answers');
    }

    if (improvements.length === 0) {
      improvements.push('Continue maintaining current performance standards');
    }

    return {
      strengths: strengths.slice(0, 5),
      improvements: improvements.slice(0, 5),
    };
  }

  /**
   * Generate feedback for individual answer
   */
  _generateAnswerFeedback(finalScore, keywordScore, contentScore, confidenceScore, starDetected) {
    const level = this._getPerformanceLevel(finalScore);

    let feedback = `${level} response. `;

    if (keywordScore >= 75) {
      feedback += 'Good keyword alignment with the question. ';
    } else if (keywordScore < 50) {
      feedback += 'Consider addressing more key points from the question. ';
    }

    if (contentScore >= 75) {
      feedback += 'Substantial and relevant content. ';
    }

    if (confidenceScore < 50) {
      feedback += 'Work on expressing your ideas with more confidence. ';
    }

    if (starDetected.complete) {
      feedback += 'Excellent use of the STAR method.';
    }

    return feedback.trim();
  }

  /**
   * Generate overall recommendation
   */
  _generateRecommendation(overallScore, improvements) {
    if (overallScore >= 85) {
      return 'Excellent performance! You are well-prepared for interviews in this role. Continue practicing to maintain this level.';
    } else if (overallScore >= 75) {
      return 'Good performance! Focus on the areas identified below to further improve your interview skills.';
    } else if (overallScore >= 65) {
      return 'Satisfactory performance. Work on the improvements suggested to strengthen your interview responses.';
    } else {
      return 'You have room for improvement. Dedicate time to practice and focus on the suggested areas to boost your performance.';
    }
  }
}

export default new SmartScoringService();
