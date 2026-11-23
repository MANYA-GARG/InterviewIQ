
import adminDashboardService from '../services/adminDashboard.service.js';

export const getOverview = async (req, res, next) => {
  try {
    const data = await adminDashboardService.getAdminOverview();

    res.status(200).json({
      success: true,
      message: 'Admin dashboard overview fetched successfully',
      data,
    });
  } catch (error) {
    console.error('Admin dashboard overview error:', error);

    next(error);
  }
};

export default {
  getOverview,
};
