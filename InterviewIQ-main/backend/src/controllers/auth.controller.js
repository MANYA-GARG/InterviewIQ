import authService from '../services/auth.service.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : name;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
    const normalizedPassword = typeof password === 'string' ? password.trim() : password;

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields required',
        error: false
      });
    }

    const result = await authService.register(normalizedName, normalizedEmail, normalizedPassword);

    // Existing verified user is a handled business case, not a transport error.
    if (!result.success) {
      return res.status(200).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Registration failed',
      error: false
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : req.body?.email;
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : req.body?.otp;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP required',
        error: false
      });
    }

    const result = await authService.verifyOTPAndLogin(email, otp);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'OTP verification failed',
      error: false
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
    const normalizedPassword = typeof password === 'string' ? password.trim() : password;

    console.log('Login request received:', normalizedEmail);

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required',
        error: false
      });
    }

    const result = await authService.login(normalizedEmail, normalizedPassword);
    console.log('Login response:', {
      success: result?.success,
      hasToken: Boolean(result?.token),
      hasUser: Boolean(result?.user)
    });
    console.log('Login successful, sending response');
    return res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
      message: result.message || 'Login successful',
      refreshToken: result.refreshToken,
      error: false
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.code === 'ACCOUNT_NOT_VERIFIED') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_NOT_VERIFIED',
        message: error.message || 'Please verify your email',
        error: false
      });
    }

    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || 'Invalid credentials',
      error: false
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || 'Token refresh failed'
    });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    const result = await authService.logout(userId);
    res.json(result);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email required',
        error: false
      });
    }

    const result = await authService.resendOTP(email);
    res.status(200).json(result);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Resend OTP failed',
      error: false
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email required',
        error: false,
      });
    }

    const result = await authService.forgotPassword(normalizedEmail);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to process forgot password request',
      error: false,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
    const normalizedOTP = typeof otp === 'string' ? otp.trim() : otp;
    const normalizedPassword = typeof newPassword === 'string' ? newPassword.trim() : newPassword;

    if (!normalizedEmail || !normalizedOTP || !normalizedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP and new password required',
        error: false,
      });
    }

    const result = await authService.resetPassword(normalizedEmail, normalizedOTP, normalizedPassword);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Password reset failed',
      error: false,
    });
  }
};
