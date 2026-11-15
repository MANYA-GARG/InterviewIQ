import express from 'express';
import {
  evaluateInterview,
  getEvaluation,
  getInterviewResult,
  getUserEvaluations
} from '../controllers/evaluation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/:interviewId/evaluate', evaluateInterview);
router.get('/:interviewId/result', getInterviewResult);
router.get('/:interviewId', getEvaluation);
router.get('/', getUserEvaluations);

export default router;
