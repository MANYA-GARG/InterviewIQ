
import express from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { getOverview } from '../controllers/adminDashboard.controller.js';

const router = express.Router();

// All dashboard routes require authentication and admin privileges
router.use(protect, restrictTo('admin'));

// Overview analytics
router.get('/overview', getOverview);

export default router;
