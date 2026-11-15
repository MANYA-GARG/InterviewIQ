import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadRecording } from '../middlewares/upload.middleware.js';
import {
  generateFromResume,
  saveInterviewRecording,
} from '../controllers/interview.controller.js';

const router = express.Router();

router.use(protect);
router.post('/generate-from-resume', generateFromResume);
router.post('/save-recording', uploadRecording.single('recording'), saveInterviewRecording);

export default router;
