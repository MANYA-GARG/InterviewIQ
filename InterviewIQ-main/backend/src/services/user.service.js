import User from '../models/User.js';
import AppError from '../utils/AppError.js';

class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        throw new AppError('Email already in use', 400);
      }
    }

    // Update user
    Object.keys(updateData).forEach((key) => {
      user[key] = updateData[key];
    });

    await user.save();

    return user;
  }

  async deleteAccount(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await User.findByIdAndDelete(userId);

    return {
      message: 'Account deleted successfully',
    };
  }

  async getAllUsers(query) {
    const { page = 1, limit = 10, role } = query;

    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password -refreshToken')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(filter);

    return {
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count,
    };
  }
}

export default new UserService();
