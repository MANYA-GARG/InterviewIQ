import express from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { getAIMonitoringDashboard } from '../controllers/aiMonitoring.controller.js';

const router = express.Router();

// Protect all AI monitoring endpoints
router.use(protect, restrictTo('admin'));

// Get AI monitoring analytics
router.get('/', getAIMonitoringDashboard);

export default router;