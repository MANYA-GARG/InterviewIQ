import interviewService from '../services/interview.service.js';

export const createInterview = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Interview request payload is required',
      });
    }

    console.log('[interview.create] request received', {
      userId: req.user?._id?.toString?.(),
      jobRole: req.body?.jobRole,
      experienceLevel: req.body?.experienceLevel,
      numberOfQuestions: req.body?.numberOfQuestions,
      hasResumeId: Boolean(req.body?.resumeId),
      mode: req.body?.mode,
    });

    const result = await interviewService.createInterview(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Interview created successfully',
      interview: result.interview,
      questions: result.questions,
      data: result
    });
  } catch (error) {
    console.error('Create interview error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create interview'
    });
  }
};

export const startInterview = async (req, res) => {
  try {
    const interviewId = req.params.id;
    console.log('[interview.start] Request received', {
      interviewId,
      userId: req.user?._id?.toString?.(),
      token: req.headers.authorization?.split(' ')[1]?.substring(0, 10)
    });

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID required',
      });
    }

    const result = await interviewService.startInterview(interviewId, req.user._id);
    console.log('[interview.start] Success', { interviewId, status: result.status });
    
    res.status(200).json({
      success: true,
      message: 'Interview started successfully',
      data: result
    });
  } catch (error) {
    console.error('[interview.start] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to start interview'
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    // Accept both typed answerText and transcript from voice frontend
    const { questionId, answerText: rawAnswerText, transcript, interviewId, timeTaken, confidenceLevel, isSkipped } = req.body;
    const answerText = (rawAnswerText || transcript || '').toString();
    console.log('[interview.answer] Request received', {
      userId: req.user?._id?.toString?.(),
      interviewId,
      questionId,
      answerLength: answerText?.length,
      isSkipped,
      token: req.headers.authorization?.split(' ')[1]?.substring(0, 10)
    });

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required',
      });
    }

    // Allow either a non-empty answer (typed or transcript) or explicit skip flag
    if (!answerText?.trim() && !isSkipped) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an answer or explicitly skip the question',
      });
    }

    // Build sanitized payload for service
    const payload = {
      ...req.body,
      answerText,
    };

    const answer = await interviewService.submitAnswer(req.user._id, payload);
    console.log('[interview.answer] Success', { questionId, answerId: answer._id, status: answer.status });
    
    res.status(201).json({
      success: true,
      message: 'Answer submitted successfully',
      data: { answer }
    });
  } catch (error) {
    console.error('[interview.answer] Error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to submit answer'
    });
  }
};

export const submitVoiceAnswer = async (req, res) => {
  try {
    const answer = await interviewService.submitVoiceAnswer(
      req.user._id,
      req.body,
      req.file
    );
    res.status(201).json({
      success: true,
      message: 'Voice answer submitted successfully',
      data: { answer }
    });
  } catch (error) {
    console.error('Submit voice answer error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to submit voice answer'
    });
  }
};

export const completeInterview = async (req, res) => {
  try {
    const interviewId = req.params.id;
    console.log('[interview.complete] Request received', {
      interviewId,
      userId: req.user?._id?.toString?.(),
      token: req.headers.authorization?.split(' ')[1]?.substring(0, 10)
    });

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID required',
      });
    }

    const result = await interviewService.completeInterview(
      interviewId,
      req.user._id,
      req.body || {}
    );
    
    console.log('[interview.complete] Success', { 
      interviewId, 
      status: result.interview?.status,
      hasEvaluation: !!result.evaluation
    });
    
    res.status(200).json({
      success: true,
      message: 'Interview completed and evaluated successfully',
      data: {
        interview: result.interview,
        evaluation: result.evaluation
      }
    });
  } catch (error) {
    console.error('[interview.complete] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to complete interview'
    });
  }
};

export const logSuspiciousActivity = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const result = await interviewService.logSuspiciousActivity(
      interviewId,
      req.user._id,
      req.body || {}
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Log suspicious activity error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to log suspicious activity',
    });
  }
};

export const getInterview = async (req, res) => {
  try {
    const result = await interviewService.getInterview(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Interview retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get interview error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve interview'
    });
  }
};

export const getUserInterviews = async (req, res) => {
  try {
    const result = await interviewService.getUserInterviews(req.user._id, req.query);
    res.status(200).json({
      success: true,
      message: 'Interviews retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get interviews error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve interviews'
    });
  }
};

export const deleteInterview = async (req, res) => {
  try {
    const result = await interviewService.deleteInterview(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete interview error:', error);
      res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete interview'
    });
  }
};

export const generateFromResume = async (req, res) => {
  try {
    const result = await interviewService.generateFromResume(req.user._id, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Generate from resume error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate interview questions from resume',
    });
  }
};

export const saveInterviewRecording = async (req, res) => {
  try {
    const recording = await interviewService.saveRecording(req.user._id, req.body, req.file);
    res.status(201).json({
      success: true,
      data: { recording },
    });
  } catch (error) {
    console.error('Save interview recording error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to save interview recording',
    });
  }
};
