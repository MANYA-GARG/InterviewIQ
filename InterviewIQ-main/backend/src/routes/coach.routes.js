import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { generatePlan, latestPlan, toggleTask } from '../controllers/coach.controller.js';

const router = express.Router();
router.use(protect);

router.post('/plan', generatePlan);
router.get('/plan/latest', latestPlan);
router.put('/plan/:id/task', toggleTask); // PUT, because your CORS config does not allow PATCH

export default router;