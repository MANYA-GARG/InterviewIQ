import express from 'express';
import {
  uploadResume,
  getUserResumes,
  getResumeById,
  deleteResume,
  getResumeAnalysis,
  matchResume,
  atsCheck
} from '../controllers/resume.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadResume as uploadResumeMiddleware } from '../middlewares/upload.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', uploadResumeMiddleware.single('resume'), uploadResume);
router.get('/', getUserResumes);
router.get('/:id/analysis', getResumeAnalysis);
router.get('/:id/ats-check', atsCheck);
router.post('/:id/match', matchResume);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);

export default router;