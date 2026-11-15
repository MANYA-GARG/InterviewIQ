import express from 'express';
import {
  createInterview,
  startInterview,
  submitAnswer,
  submitVoiceAnswer,
  completeInterview,
  logSuspiciousActivity,
  getInterview,
  getUserInterviews,
  deleteInterview
} from '../controllers/interview.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadAudio } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createInterviewSchema,
  submitAnswerSchema,
} from '../validators/interview.validator.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Answer submission routes (MUST come before /:id routes)
router.post('/answer', validate(submitAnswerSchema), submitAnswer);
router.post(
  '/answer/voice',
  uploadAudio.single('audio'),
  submitVoiceAnswer
);

// Interview CRUD routes
router.post('/', validate(createInterviewSchema), createInterview);
router.get('/', getUserInterviews);
router.get('/:id', getInterview);
router.post('/:id/start', startInterview);
router.post('/:id/complete', completeInterview);
router.post('/:id/activity', logSuspiciousActivity);
router.delete('/:id', deleteInterview);

export default router;
