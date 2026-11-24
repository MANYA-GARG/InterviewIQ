import express from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { askAdminCopilot } from '../controllers/aiAdminCopilot.controller.js';

const router = express.Router();

// Admin-only access
router.use(protect, restrictTo('admin'));

// Ask the AI Admin Copilot
router.post('/ask', askAdminCopilot);

export default router;