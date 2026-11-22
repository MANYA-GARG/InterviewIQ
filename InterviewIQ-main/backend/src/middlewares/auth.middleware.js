import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export const protect = async (req, res, next) =>  {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token missing',
        error: false
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token missing',
        error: false
      });
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.',
          error: false
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email first',
          error: false
        });
      }

      if (user.accountStatus === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Contact the administrator.',
          error: false
        });
      }

      req.user = user;
      next();

    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: false
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);

    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.',
      error: false
    });
  }
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  }

  next();
};