import userService from '../services/user.service.js';

export const getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve profile'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const result = await userService.deleteAccount(req.user._id);
    
    // Clear cookies if they're being used in production
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete account error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete account'
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers(req.query);
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get all users error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve users'
    });
  }
};
