import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { getDBStatus } from '../../config/db.js';

const client = new OAuth2Client();

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Verifies a Google ID token (the `credential` sent by the frontend) and signs
 * the user in. Creates the account on first use. Returns the same shape as the
 * normal /auth/login response.
 */
export async function loginWithGoogle(credential) {
  if (getDBStatus() !== 'connected') {
    throw fail('Database connection failed. Please try again shortly.', 503);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw fail('Google sign-in is not configured on the server', 500);
  }

  // 1. Verify signature, expiry and that the token was issued for OUR client id
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch (error) {
    throw fail('Invalid Google credential', 401);
  }

  if (!payload?.email || !payload.email_verified) {
    throw fail('Your Google email address is not verified', 401);
  }

  const email = payload.email.toLowerCase();

  // 2. Find or create the user
  let user = await User.findOne({ email });

  if (user?.accountStatus === 'SUSPENDED') {
    throw fail('Your account has been suspended. Contact the administrator.', 403);
  }

  if (!user) {
    user = new User({
      name: payload.name || email.split('@')[0],
      email,
      // Required by the schema; random because Google users never type a password
      // (it is hashed by the model's pre-save hook).
      password: crypto.randomBytes(32).toString('hex'),
      isVerified: true,
      accountStatus: 'ACTIVE',
      profilePicture: payload.picture || null,
    });
  } else {
    // Google has proven they own this email, so no OTP step is needed
    if (!user.isVerified) {
      user.isVerified = true;
      user.accountStatus = 'ACTIVE';
      user.otp = undefined;
      user.otpExpiry = undefined;
    }
    if (!user.profilePicture && payload.picture) {
      user.profilePicture = payload.picture;
    }
  }

  // 3. Issue the app's own tokens, exactly like the password login does
  const token = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();

  return {
    success: true,
    message: 'Login successful',
    error: false,
    token,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
