import aiAdminCopilotService from '../services/aiAdminCopilot.service.js';
import aiMonitoringService from '../services/aiMonitoring.service.js';

export const askAdminCopilot = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid question.',
      });
    }

    const days = 30;

    // Fetch AI monitoring analytics
    const monitoringData =
      await aiMonitoringService.getAIMonitoringAnalytics(days);

    // Ask AI Admin Copilot
    const answer = await aiAdminCopilotService.askCopilot(
      question,
      monitoringData
    );

    return res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        model: 'Groq',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};