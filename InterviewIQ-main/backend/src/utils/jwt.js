import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId) => {
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_key_change_in_production';
  const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  
  return jwt.sign({ userId }, secret, { expiresIn: expiry });
};

export const generateRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_change_in_production';
  const expiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  
  return jwt.sign({ userId }, secret, { expiresIn: expiry });
};

export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_key_change_in_production';
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

export const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_change_in_production';
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
};
