import express from 'express';
import { register, verifyOTP, login, refreshToken, logout, resendOTP, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { googleLogin } from '../controllers/googleAuth.controller.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh-token', refreshToken);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (would need auth middleware)
router.post('/logout', logout);

export default router;
