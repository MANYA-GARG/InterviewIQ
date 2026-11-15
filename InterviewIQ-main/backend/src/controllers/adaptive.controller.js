import adaptiveInterviewer from '../services/adaptiveInterviewer.service.js';

export const followUp = async (req, res) => {
  try {
    const { questionId } = req.body || {};
    if (!questionId) {
      return res.status(400).json({ success: false, message: 'questionId is required' });
    }

    const decision = await adaptiveInterviewer.decide(req.params.id, req.user._id, questionId);
    res.status(200).json({ success: true, data: { decision } });
  } catch (error) {
    console.error('[adaptive] follow-up error:', error?.message || error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to decide follow-up',
    });
  }
};