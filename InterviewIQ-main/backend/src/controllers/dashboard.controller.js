import reportService from '../services/report.service.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const summary = await reportService.getDashboardSummary(req.user._id);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Failed to retrieve dashboard summary:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve dashboard summary',
    });
  }
};
