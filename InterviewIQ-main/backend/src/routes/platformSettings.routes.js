import express from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
  getPublicAnnouncement,
} from '../controllers/platformSettings.controller.js';

const router = express.Router();

// Public read-only announcement endpoint
router.get('/announcement', getPublicAnnouncement);

// Admin-protected settings routes
router.use(protect, restrictTo('admin'));

router.get('/', getPlatformSettings);
router.patch('/', updatePlatformSettings);

export default router;