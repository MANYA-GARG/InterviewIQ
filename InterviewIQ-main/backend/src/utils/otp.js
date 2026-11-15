import crypto from 'crypto';

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const generateOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

export const verifyOTP = (storedOTP, inputOTP, expiresAt) => {
  if (!storedOTP || !expiresAt) {
    return { valid: false, message: 'No OTP found' };
  }
  
  if (new Date() > new Date(expiresAt)) {
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (storedOTP !== inputOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  return { valid: true, message: 'OTP verified' };
};
