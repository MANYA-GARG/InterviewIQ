import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { nextAnswer, rate, agreement } from '../controllers/evidence.controller.js';

const router = express.Router();
router.use(protect);

router.get('/next', nextAnswer);
router.post('/rate', rate);
router.get('/agreement', agreement);

export default router;