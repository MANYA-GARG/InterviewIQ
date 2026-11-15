/**
 * Analysis Routes
 * Endpoints for answer and interview analysis
 */

import express from 'express';
import {
  analyzeSingleAnswer,
  analyzeInterview,
  batchAnalyzeAnswers,
  quickAnalyze,
  getAnalysisStatus,
  regenerateAnalysis,
  exportAnalysis,
} from '../controllers/analysis.controller.js';

const router = express.Router();

/**
 * Public endpoints (no auth required for quick analysis)
 */

// Quick analysis without database storage
router.post('/quick', quickAnalyze);

// System status
router.get('/status', getAnalysisStatus);

/**
 * Protected endpoints (require authentication)
 */

// Analyze single answer
router.post('/answer/:answerId', analyzeSingleAnswer);

// Regenerate analysis for an answer
router.post('/regenerate/:answerId', regenerateAnalysis);

// Export analysis
router.get('/export/:answerId', exportAnalysis);

// Analyze entire interview
router.post('/interview/:interviewId', analyzeInterview);

// Batch analyze multiple answers
router.post('/batch', batchAnalyzeAnswers);

export default router;
