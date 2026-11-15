import evaluationService from '../services/evaluation.service.js';

export const evaluateInterview = async (req, res) => {
  try {
    const evaluation = await evaluationService.evaluateInterview(
      req.params.interviewId,
      req.user._id
    );
    res.status(201).json({
      success: true,
      message: 'Interview evaluated successfully',
      data: { evaluation }
    });
  } catch (error) {
    console.error('Evaluate interview error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to evaluate interview'
    });
  }
};

export const getInterviewResult = async (req, res) => {
  try {
    const evaluation = await evaluationService.getEvaluation(
      req.params.interviewId,
      req.user._id
    );

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Interview result not found. Please ensure the interview is completed and evaluated.'
      });
    }

    // Format result response
    const result = {
      score: evaluation.overallScore,
      feedback: evaluation.overallFeedback,
      categoryScores: evaluation.categoryScores,
      questionDetails: evaluation.questionEvaluations,
      interviewInfo: evaluation.interview,
      evaluatedAt: evaluation.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Interview result retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get interview result error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve interview result'
    });
  }
};

export const getEvaluation = async (req, res) => {
  try {
    const evaluation = await evaluationService.getEvaluation(
      req.params.interviewId,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: 'Evaluation retrieved successfully',
      data: { evaluation }
    });
  } catch (error) {
    console.error('Get evaluation error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve evaluation'
    });
  }
};

export const getUserEvaluations = async (req, res) => {
  try {
    const result = await evaluationService.getUserEvaluations(req.user._id, req.query);
    res.status(200).json({
      success: true,
      message: 'Evaluations retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get evaluations error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve evaluations'
    });
  }
};
