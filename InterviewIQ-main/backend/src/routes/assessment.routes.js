import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getRoles,
  startSession,
  submitAnswer,
  getSession,
  getAbilities,
  getPlan
} from '../controllers/assessment.controller.js';

const router = express.Router();
router.use(protect);

router.get('/roles', getRoles);
router.get('/abilities', getAbilities);
router.post('/sessions', startSession);
router.get('/sessions/:id', getSession);
router.post('/sessions/:id/answer', submitAnswer);
router.get('/sessions/:id/plan', getPlan);

export default router;