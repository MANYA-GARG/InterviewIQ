import express from 'express';
import {
  getProfile,
  updateProfile,
  deleteAccount,
  getAllUsers
} from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema } from '../validators/user.validator.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// User routes
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.delete('/account', deleteAccount);

// Admin only routes
router.get('/', restrictTo('admin'), getAllUsers);

export default router;
