import express from 'express';
import {
  getUserProgress,
  getDetailedReport,
  getScoreTrend,
  getAggregatedTrend,
  getPerformanceOverTime,
  getCategoryScores,
  getSkillDistribution,
  getSmartInsights,
  getHeatmap,
  getProgressTrends,
} from '../controllers/report.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/progress', getUserProgress);
router.get('/detailed', getDetailedReport);
router.get('/trend', getScoreTrend);
router.get('/trend/aggregate', getAggregatedTrend);
router.get('/performance', getPerformanceOverTime);
router.get('/category-scores', getCategoryScores);
router.get('/skills', getSkillDistribution);
router.get('/insights', getSmartInsights);
router.get('/heatmap', getHeatmap);
router.get('/progress-trends', getProgressTrends);

export default router;
