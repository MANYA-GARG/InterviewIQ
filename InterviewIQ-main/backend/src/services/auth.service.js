
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

import { generateOTP, generateOTPExpiry, verifyOTP } from '../utils/otp.js';

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/jwt.js';

import { sendOTPEmail } from '../config/email.js';
import { getDBStatus } from '../../config/db.js';

class AuthService {
  assertDatabaseReady() {
    if (getDBStatus() !== 'connected') {
      const error = new Error(
        'Database connection failed. Set a valid MONGO_URI or MONGODB_URI and restart the server.'
      );
      error.statusCode = 503;
      error.code = 'DATABASE_NOT_CONNECTED';
      throw error;
    }
  }

  async register(name, email, password) {
    try {
      this.assertDatabaseReady();

      console.log('[AUTH] Register request:', { email, name });

      const existingUser = await User.findOne({ email });

      // User already verified
      if (existingUser && existingUser.isVerified) {
        return {
          success: false,
          message: 'User already registered. Please login.',
          code: 'USER_ALREADY_REGISTERED',
          error: false
        };
      }

      // Existing user but not verified - resend OTP
      if (existingUser && !existingUser.isVerified) {
        const otp = generateOTP();
        const otpExpiry = generateOTPExpiry();

        existingUser.otp = String(otp);
        existingUser.otpExpiry = otpExpiry;

        await existingUser.save();

        const otpSent = await sendOTPEmail(
          email,
          otp,
          existingUser.name
        );

        if (!otpSent) {
          const emailError = new Error(
            'Unable to send OTP email right now. Please try resend OTP in a moment.'
          );
          emailError.statusCode = 502;
          emailError.code = 'EMAIL_DELIVERY_FAILED';
          throw emailError;
        }

        return {
          success: true,
          message: 'Account exists but not verified. OTP resent to your email.',
          error: false,
          data: {
            email: existingUser.email,
            userId: existingUser._id
          }
        };
      }

      // New user registration
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      const user = new User({
        name,
        email,
        password,
        otp: String(otp),
        otpExpiry,
        isVerified: false,
        accountStatus: 'PENDING'
      });

      await user.save();

      const otpSent = await sendOTPEmail(email, otp, name);

      if (!otpSent) {
        const emailError = new Error(
          'Unable to send OTP email right now. Please try again.'
        );
        emailError.statusCode = 502;
        emailError.code = 'EMAIL_DELIVERY_FAILED';
        throw emailError;
      }

      return {
        success: true,
        message: 'Registration successful. OTP sent to your email.',
        error: false,
        data: {
          email: user.email,
          userId: user._id
        }
      };

    } catch (error) {
      console.error('Register service error:', error);

      const serviceError = new Error(
        error.message || 'Registration failed'
      );

      serviceError.statusCode = error.statusCode || 500;
      serviceError.code = error.code;

      throw serviceError;
    }
  }

  async verifyOTPAndLogin(email, otpCode) {
    try {
      this.assertDatabaseReady();

      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 401;
        throw error;
      }

      // Check OTP
      if (!user.otp) {
        throw new Error(
          'No OTP found. Please register or request a new OTP.'
        );
      }

      const otpString = String(otpCode).trim();
      const storedOtp = String(user.otp).trim();

      if (storedOtp !== otpString) {
        const error = new Error('Invalid OTP');
        error.statusCode = 400;
        throw error;
      }

      // Check OTP expiry
      if (
        !user.otpExpiry ||
        new Date() > new Date(user.otpExpiry)
      ) {
        const error = new Error(
          'OTP expired. Please request a new OTP.'
        );
        error.statusCode = 400;
        throw error;
      }

      // Verify account
      user.isVerified = true;
      user.accountStatus = 'ACTIVE';
      user.otp = undefined;
      user.otpExpiry = undefined;

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      user.lastLoginAt = new Date();

      await user.save();

      return {
        success: true,
        message: 'Email verified successfully',
        error: false,
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };

    } catch (error) {
      console.error('Verify OTP service error:', error);

      const serviceError = new Error(
        error.message || 'OTP verification failed'
      );

      serviceError.statusCode = error.statusCode || 400;
      throw serviceError;
    }
  }

  async login(email, password) {
    try {
      this.assertDatabaseReady();

      console.log('[AUTH] Login request:', { email });

      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
      }

      // Check verification
      if (!user.isVerified) {
        const error = new Error('Please verify your email');
        error.code = 'ACCOUNT_NOT_VERIFIED';
        error.statusCode = 403;
        error.userEmail = email;
        throw error;
      }

      // Block suspended accounts
      if (user.accountStatus === 'SUSPENDED') {
        const error = new Error(
          'Your account has been suspended. Contact the administrator.'
        );
        error.statusCode = 403;
        throw error;
      }

      // Update last login
      user.lastLoginAt = new Date();

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token and last login
      user.refreshToken = refreshToken;
      await user.save();

      console.log('[AUTH] Login database save success:', user.email);

      return {
        success: true,
        message: 'Login successful',
        error: false,
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };

    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      this.assertDatabaseReady();

      if (!refreshToken) {
        throw new Error('Refresh token required');
      }

      const decoded = verifyRefreshToken(refreshToken);

      const user = await User.findById(decoded.userId)
        .select('+refreshToken');

      if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const newAccessToken = generateAccessToken(user._id);

      return {
        success: true,
        data: {
          accessToken: newAccessToken
        }
      };

    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }

  async resendOTP(email) {
    try {
      this.assertDatabaseReady();

      console.log('[AUTH] Resend OTP request:', { email });

      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isVerified) {
        throw new Error('User already verified. Please login.');
      }

      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      user.otp = String(otp);
      user.otpExpiry = otpExpiry;

      await user.save();

      const otpSent = await sendOTPEmail(email, otp, user.name);

      if (!otpSent) {
        const emailError = new Error(
          'Unable to resend OTP right now. Please try again.'
        );
        emailError.statusCode = 502;
        emailError.code = 'EMAIL_DELIVERY_FAILED';
        throw emailError;
      }

      console.log('[AUTH] OTP resend email sent successfully:', email);

      return {
        success: true,
        message: 'OTP sent successfully',
        error: false
      };

    } catch (error) {
      console.error('Resend OTP service error:', error);
      throw new Error(error.message || 'Resend OTP failed');
    }
  }

  async forgotPassword(email) {
    try {
      this.assertDatabaseReady();

      console.log(`[AUTH] Forgot password request for email: ${email}`);

      const user = await User.findOne({ email });

      // Avoid account enumeration
      if (!user) {
        return {
          success: true,
          message: 'If this email is registered, a reset OTP has been sent.',
          error: false
        };
      }

      const otp = Math.floor(100000 + Math.random() * 900000);

      await User.findOneAndUpdate(
        { email },
        {
          resetOTP: otp,
          resetOTPExpires: Date.now() + 10 * 60 * 1000
        }
      );

      const emailSent = await sendOTPEmail(email, otp, user.name);

      if (!emailSent) {
        throw new Error('Failed to send OTP email');
      }

      console.log(
        `[AUTH] Forgot password email sent successfully to ${email}`
      );

      return {
        success: true,
        message: 'OTP sent to email',
        error: false
      };

    } catch (error) {
      console.error('Forgot password service error:', error);
      throw new Error(error.message || 'Forgot password failed');
    }
  }

  async resetPassword(email, otpCode, newPassword) {
    try {
      this.assertDatabaseReady();

      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        const error = new Error('Invalid reset request');
        error.statusCode = 400;
        throw error;
      }

      if (!user.resetOTP) {
        const error = new Error(
          'No OTP found. Please request a new OTP.'
        );
        error.statusCode = 400;
        throw error;
      }

      const otpString = String(otpCode).trim();
      const storedOtp = String(user.resetOTP).trim();

      if (storedOtp !== otpString) {
        const error = new Error('Invalid OTP');
        error.statusCode = 400;
        throw error;
      }

      if (
        !user.resetOTPExpires ||
        new Date() > new Date(user.resetOTPExpires)
      ) {
        const error = new Error(
          'OTP expired. Please request a new OTP.'
        );
        error.statusCode = 400;
        throw error;
      }

      user.password = newPassword;
      user.resetOTP = undefined;
      user.resetOTPExpires = undefined;
      user.refreshToken = undefined;

      await user.save();

      return {
        success: true,
        message: 'Password reset successful. Please login with your new password.',
        error: false
      };

    } catch (error) {
      console.error('Reset password service error:', error);

      const serviceError = new Error(
        error.message || 'Reset password failed'
      );

      serviceError.statusCode = error.statusCode || 400;
      throw serviceError;
    }
  }

  async logout(userId) {
    try {
      this.assertDatabaseReady();

      const user = await User.findById(userId);

      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      throw new Error('Logout failed');
    }
  }
}

export default new AuthService();
