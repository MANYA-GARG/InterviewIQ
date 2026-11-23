
import { getAIMonitoringAnalytics } from '../services/aiMonitoring.service.js';

export const getAIMonitoringDashboard = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;

    if (![7, 30, 90].includes(days)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range. Allowed values are 7, 30, or 90 days.',
      });
    }

    const analytics = await getAIMonitoringAnalytics(days);

    return res.status(200).json({
      success: true,
      message: 'AI monitoring analytics fetched successfully',
      data: analytics,
    });
  } catch (error) {
    console.error('[AI Monitoring Controller] Error:', error.message);
    next(error);
  }
};

export default {
  getAIMonitoringDashboard,
};
