/**
 * Analysis Controller
 * Handles answer analysis endpoints
 */

import analysisService from '../services/analysis.service.js';
import huggingFaceService from '../services/huggingFace.service.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Answer from '../models/Answer.js';
import Question from '../models/Question.js';

/**
 * Analyze single answer
 * POST /api/analysis/answer/:answerId
 */
export const analyzeSingleAnswer = asyncHandler(async (req, res) => {
  const { answerId } = req.params;

  // Validate answer exists
  const answer = await Answer.findById(answerId).populate('question');
  if (!answer) {
    throw new AppError('Answer not found', 404);
  }

  // Perform comprehensive analysis
  const analysis = await analysisService.analyzeAnswerComprehensive(
    answerId,
    answer.question._id
  );

  // Generate detailed report
  const report = analysisService.generateFeedbackReport(analysis);

  res.status(200).json({
    success: true,
    data: {
      analysis,
      report,
    },
    message: 'Answer analyzed successfully',
  });
});

/**
 * Analyze all answers in an interview
 * POST /api/analysis/interview/:interviewId
 */
export const analyzeInterview = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;

  // Get all answers for the interview
  const answers = await Answer.find({
    interview: interviewId,
  }).populate('question');

  if (answers.length === 0) {
    throw new AppError('No answers found for this interview', 404);
  }

  // Analyze each answer
  const analyses = [];
  for (const answer of answers) {
    const analysis = await analysisService.analyzeAnswerComprehensive(
      answer._id,
      answer.question._id
    );
    analyses.push(analysis);
  }

  // Calculate interview-level score
  const interviewScore = await analysisService.calculateInterviewScore(analyses);

  res.status(200).json({
    success: true,
    data: {
      interviewScore,
      answerAnalyses: analyses,
      totalAnswersAnalyzed: analyses.length,
    },
    message: 'Interview analyzed successfully',
  });
});

/**
 * Get analysis for multiple answers
 * POST /api/analysis/batch
 */
export const batchAnalyzeAnswers = asyncHandler(async (req, res) => {
  const { answerIds } = req.body;

  if (!Array.isArray(answerIds) || answerIds.length === 0) {
    throw new AppError('Invalid answer IDs provided', 400);
  }

  if (answerIds.length > 50) {
    throw new AppError('Maximum 50 answers can be analyzed at once', 400);
  }

  // Batch analysis
  const result = await analysisService.analyzeMultipleAnswers(answerIds);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Batch analysis completed',
  });
});

/**
 * Quick analyze endpoint (without database storage)
 * POST /api/analysis/quick
 * Useful for testing and quick analysis
 */
export const quickAnalyze = asyncHandler(async (req, res) => {
  const { question, answer, expectedAnswer } = req.body;

  // Validation
  if (!question || !answer) {
    throw new AppError('Question and answer are required', 400);
  }

  if (question.length < 5) {
    throw new AppError('Question must be at least 5 characters', 400);
  }

  if (answer.length < 10) {
    throw new AppError('Answer must be at least 10 characters', 400);
  }

  if (answer.length > 5000) {
    throw new AppError('Answer must be less than 5000 characters', 400);
  }

  // Import the service directly
  const answerAnalysisService = (await import('../services/answerAnalysis.service.js')).default;

  // Perform analysis (without database)
  const localAnalysis = await answerAnalysisService.analyzeAnswer(
    question,
    answer,
    expectedAnswer || ''
  );

  // Optional: Get AI analysis
  let aiAnalysis = null;
  if (huggingFaceService.isConfigured()) {
    aiAnalysis = await huggingFaceService.getAdvancedAnalysis(question, answer);
  }

  // Combine results
  const analysisResult = {
    localAnalysis: localAnalysis.localAnalysis,
    aiAnalysis: aiAnalysis || {
      analyzed: false,
      message: 'AI analysis not configured',
    },
    finalScore: localAnalysis.finalScore,
    strengths: localAnalysis.strengths,
    improvements: localAnalysis.improvements,
  };

  // Generate full report
  const report = analysisService.generateFeedbackReport(analysisResult);

  res.status(200).json({
    success: true,
    data: {
      analysis: analysisResult,
      report,
    },
    message: 'Quick analysis completed',
  });
});

/**
 * Get AI service status
 * GET /api/analysis/status
 */
export const getAnalysisStatus = asyncHandler(async (req, res) => {
  const hfStatus = await huggingFaceService.testConnection();

  res.status(200).json({
    success: true,
    data: {
      huggingface: hfStatus,
      localAnalysis: {
        status: 'available',
        message: 'Local NLP analysis is always available',
      },
    },
    message: 'Analysis system status retrieved',
  });
});

/**
 * Regenerate analysis for an answer
 * POST /api/analysis/regenerate/:answerId
 */
export const regenerateAnalysis = asyncHandler(async (req, res) => {
  const { answerId } = req.params;

  const answer = await Answer.findById(answerId).populate('question');
  if (!answer) {
    throw new AppError('Answer not found', 404);
  }

  // Force fresh analysis
  const analysis = await analysisService.analyzeAnswerComprehensive(
    answerId,
    answer.question._id
  );

  const report = analysisService.generateFeedbackReport(analysis);

  res.status(200).json({
    success: true,
    data: {
      analysis,
      report,
    },
    message: 'Analysis regenerated successfully',
  });
});

/**
 * Export analysis as JSON
 * GET /api/analysis/:answerId/export
 */
export const exportAnalysis = asyncHandler(async (req, res) => {
  const { answerId } = req.params;

  const answer = await Answer.findById(answerId).populate('question interview');
  if (!answer) {
    throw new AppError('Answer not found', 404);
  }

  const analysis = await analysisService.analyzeAnswerComprehensive(
    answerId,
    answer.question._id
  );

  const report = analysisService.generateFeedbackReport(analysis);

  const exportData = {
    timestamp: new Date().toISOString(),
    interview: {
      id: answer.interview._id,
      title: answer.interview.title || 'Interview Analysis',
    },
    question: answer.question.questionText,
    answer: answer.answerText || answer.transcript,
    analysis,
    report,
  };

  res.status(200).json({
    success: true,
    data: exportData,
    message: 'Analysis exported successfully',
  });
});
