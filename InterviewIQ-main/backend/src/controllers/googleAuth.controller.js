import { loginWithGoogle } from '../services/googleAuth.service.js';

export const googleLogin = async (req, res) => {
  try {
    const credential = req.body?.credential;

    if (typeof credential !== 'string' || !credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential required',
        error: false,
      });
    }

    const result = await loginWithGoogle(credential);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Google login error:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Google sign-in failed',
      error: false,
    });
  }
};
