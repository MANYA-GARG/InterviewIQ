import Interview from '../models/Interview.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Resume from '../models/Resume.js';
import InterviewSession from '../models/InterviewSession.js';
import InterviewRecording from '../models/InterviewRecording.js';
import aiService from './ai.service.js';
import speechService from './speech.service.js';
import smartScoringService from './smartScoringService.js';
import evaluationService from './evaluation.service.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import fs from 'fs/promises';
import AppError from '../utils/AppError.js';

// Helper function for retry logic
const retryAsync = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        console.warn(`Retry ${i + 1}/${maxRetries - 1} after ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

class InterviewService {
  async createInterview(userId, interviewData) {
    const {
      jobRole,
      experienceLevel,
      numberOfQuestions,
      resumeId,
      mode = 'text',
      timerDuration = 120,
    } = interviewData;

    let interview = null;

    try {
      console.log('[interview.create] service started', {
        userId: userId?.toString?.(),
        jobRole,
        experienceLevel,
        numberOfQuestions,
        hasResumeId: Boolean(resumeId),
      });

      let resumeText = '';
      if (resumeId) {
        const resume = await Resume.findOne({ _id: resumeId, user: userId });
        if (!resume) {
          throw new AppError('Selected resume was not found', 404);
        }
        resumeText = resume.extractedText;
      }

      // Create interview
      interview = await Interview.create({
        user: userId,
        resume: resumeId || null,
        jobRole,
        experienceLevel,
        numberOfQuestions,
        mode,
        timerDuration,
        status: 'pending',
      });

      // Generate questions using AI (with internal fallback)
      const aiQuestions = await aiService.generateInterviewQuestions(
        jobRole,
        experienceLevel,
        numberOfQuestions,
        resumeText
      );

      // Save questions to database
      const questions = await Promise.all(
        aiQuestions.map((q, index) =>
          Question.create({
            interview: interview._id,
            questionText: q.questionText,
            questionNumber: index + 1,
            category: q.category,
            difficulty: this.classifyDifficulty(q.questionText, experienceLevel),
            expectedAnswer: q.expectedAnswer,
          })
        )
      );

      console.log('[interview.create] service completed', {
        interviewId: interview._id.toString(),
        questionCount: questions.length,
      });

      return {
        interview,
        questions,
      };
    } catch (error) {
      console.error('[interview.create] service failed', error);

      if (interview?._id) {
        await Question.deleteMany({ interview: interview._id });
        await Interview.findByIdAndDelete(interview._id);
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to create interview', 500);
    }
  }

  classifyDifficulty(questionText, experienceLevel) {
    const normalizedText = questionText.toLowerCase();

    const hardSignals = [
      'architecture',
      'scalability',
      'distributed',
      'optimize',
      'performance',
      'trade-off',
      'complexity',
      'design',
      'system design',
      'latency',
    ];

    const easySignals = [
      'what is',
      'define',
      'explain',
      'difference between',
      'list',
      'give examples',
    ];

    if (hardSignals.some((term) => normalizedText.includes(term))) {
      return 'hard';
    }

    if (easySignals.some((term) => normalizedText.includes(term))) {
      return 'easy';
    }

    if (experienceLevel === 'fresher') {
      return 'easy';
    }

    if (experienceLevel === 'experienced') {
      return 'hard';
    }

    return 'medium';
  }

  async startInterview(interviewId, userId) {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.status !== 'pending') {
      throw new AppError('Interview already started', 400);
    }

    interview.status = 'in-progress';
    interview.startedAt = new Date();
    await interview.save();

    const questions = await Question.find({ interview: interviewId }).sort({
      questionNumber: 1,
    });

    const questionQueue = questions.map((question) => question._id);
    let session = await InterviewSession.findOne({ interview: interviewId, user: userId });

    if (!session) {
      session = await InterviewSession.create({
        interview: interviewId,
        user: userId,
        questionQueue,
        currentQuestionIndex: 0,
        mode: interview.mode,
        timerDuration: interview.timerDuration,
        status: 'in-progress',
        startedAt: new Date(),
      });
    } else {
      session.questionQueue = questionQueue;
      session.currentQuestionIndex = 0;
      session.mode = interview.mode;
      session.timerDuration = interview.timerDuration;
      session.status = 'in-progress';
      session.startedAt = new Date();
      await session.save();
    }

    return {
      interview,
      questions,
      session,
    };
  }

  async submitAnswer(userId, answerData) {
    const { questionId, answerText, interviewId, timeTaken, isSkipped } = answerData;

    console.log('[interview.submitAnswer] Service called', {
      userId: userId.toString(),
      questionId,
      answerLength: answerText?.length,
      isSkipped
    });

    // Find question with interview
    const question = await Question.findById(questionId).populate('interview');

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // Verify user owns the interview
    if (question.interview.user.toString() !== userId.toString()) {
      console.error('Unauthorized attempt', { userId, ownerId: question.interview.user });
      throw new AppError('Unauthorized - Not your interview', 403);
    }

    // Check if interview is in progress
    if (question.interview.status !== 'in-progress') {
      console.error('Interview not in progress', { status: question.interview.status });
      throw new AppError('Interview is not in progress', 403);
    }

    // CRITICAL: Validate answer - never save empty answers unless explicitly skipped
    const finalAnswerText = (answerText || '').toString().trim();
    let answerStatus = 'answered';

    if (isSkipped) {
      answerStatus = 'skipped';
    } else if (!finalAnswerText) {
      throw new AppError('Answer cannot be empty. Please provide an answer or skip the question.', 400);
    }

    // Upsert answer - create or update existing (atomic operation)
    const answer = await Answer.findOneAndUpdate(
      {
        interview: question.interview._id,
        question: questionId,
      },
      {
        answerText: finalAnswerText || '',
        status: answerStatus,
        timeTaken: timeTaken || 0,
        mode: 'text',
        submittedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log('[interview.submitAnswer] Answer saved successfully', { 
      answerId: answer._id.toString(), 
      status: answer.status,
      answerLength: answer.answerText?.length || 0,
      isNew: answer.createdAt === answer.updatedAt 
    });

    await this.updateSessionProgress(question.interview._id, userId);

    return answer;
  }

  async submitVoiceAnswer(userId, answerData, audioFile) {
    const { questionId, timeTaken, answerTextFallback } = answerData;

    console.log('[interview.submitVoiceAnswer] Service called', {
      userId: userId.toString(),
      questionId,
      hasAudioFile: !!audioFile,
      hasFallback: !!answerTextFallback
    });

    if (!audioFile && !answerTextFallback) {
      throw new AppError('No audio file or fallback text provided', 400);
    }

    const question = await Question.findById(questionId).populate('interview');

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    if (question.interview.user.toString() !== userId.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    if (question.interview.status !== 'in-progress') {
      throw new AppError('Interview is not in progress', 403);
    }

    let transcript = '';
    let audioUrl = '';
    let cloudinaryPublicId = '';
    let answerStatus = 'answered';

    try {
      // Try to process audio file if provided
      if (audioFile) {
        try {
          // Validate audio file
          speechService.validateAudioFile(audioFile);

          // Transcribe audio to text (with retry)
          transcript = await retryAsync(
            () => speechService.transcribeAudio(audioFile.path),
            2,
            500
          );

          // Upload audio to Cloudinary (with retry for network issues)
          if (isCloudinaryConfigured) {
            const cloudinaryResponse = await retryAsync(
              () => cloudinary.uploader.upload(audioFile.path, {
                folder: 'interviewiq/audio',
                resource_type: 'video',
              }),
              2,
              1000
            );

            audioUrl = cloudinaryResponse.secure_url;
            cloudinaryPublicId = cloudinaryResponse.public_id;
          }

          // Delete local file
          await fs.unlink(audioFile.path);
        } catch (audioError) {
          console.warn('[interview.submitVoiceAnswer] Audio processing failed, using fallback:', audioError.message);
          
          // Clean up file
          try {
            if (audioFile?.path) {
              await fs.unlink(audioFile.path);
            }
          } catch (unlinkError) {
            console.error('Error deleting audio file:', unlinkError);
          }

          // Use fallback text if audio processing fails
          transcript = answerTextFallback?.trim?.() || '';
          answerStatus = !transcript ? 'skipped' : 'answered';
        }
      } else {
        // No audio file, use fallback text
        transcript = answerTextFallback?.trim?.() || '';
        answerStatus = !transcript ? 'skipped' : 'answered';
      }

      // Upsert answer - create or update existing
      const answer = await Answer.findOneAndUpdate(
        {
          interview: question.interview._id,
          question: questionId,
        },
        {
          answerText: transcript || answerTextFallback?.trim?.() || '', // Fallback chain
          transcript: transcript || '',
          audioUrl: audioUrl || null,
          cloudinaryPublicId: cloudinaryPublicId || null,
          mode: audioUrl ? 'voice' : 'text', // Mark as voice only if audio was successfully uploaded
          status: answerStatus,
          timeTaken: timeTaken || 0,
          submittedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      console.log('[interview.submitVoiceAnswer] Answer saved', { 
        answerId: answer._id, 
        mode: answer.mode,
        status: answer.status,
        hasTranscript: !!answer.transcript,
        hasAudioUrl: !!answer.audioUrl
      });

      await this.updateSessionProgress(question.interview._id, userId);

      return answer;
    } catch (error) {
      console.error('[interview.submitVoiceAnswer] Error:', error);
      
      // Clean up file if anything fails
      try {
        if (audioFile?.path) {
          await fs.unlink(audioFile.path);
        }
      } catch (unlinkError) {
        console.error('Error deleting audio file:', unlinkError);
      }
      
      throw error;
    }
  }

  async updateSessionProgress(interviewId, userId) {
    const session = await InterviewSession.findOne({ interview: interviewId, user: userId });

    if (!session) {
      return;
    }

    const totalQuestions = session.questionQueue.length;
    session.currentQuestionIndex = Math.min(
      session.currentQuestionIndex + 1,
      totalQuestions
    );

    if (session.currentQuestionIndex >= totalQuestions) {
      session.status = 'completed';
      session.completedAt = new Date();
    }

    await session.save();
  }

  async completeInterview(interviewId, userId) {
    const completionData = arguments[2] || {};
    
    console.log('[interview.complete] Request started', {
      interviewId: interviewId.toString(),
      userId: userId.toString(),
      hasCompletionAnswers: Array.isArray(completionData.answers)
    });

    const interview = await Interview.findOne({ _id: interviewId, user: userId });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // CRITICAL: Prevent double completion
    if (interview.status === 'completed' || interview.status === 'evaluated') {
      console.warn('[interview.complete] Already completed/evaluated', { 
        interviewId: interviewId.toString(),
        currentStatus: interview.status 
      });
      throw new AppError('Interview already submitted. Please wait for evaluation.', 400);
    }

    if (interview.status !== 'in-progress') {
      throw new AppError('Interview is not in progress', 400);
    }

    // Process any final answers from completion payload (fallback if frontend sent)
    if (Array.isArray(completionData.answers) && completionData.answers.length > 0) {
      const questions = await Question.find({ interview: interviewId }).select('_id');
      const validQuestionIds = new Set(questions.map((item) => item._id.toString()));

      for (const item of completionData.answers) {
        const questionId = item?.questionId;
        const answerText = item?.answerText?.trim?.() || '';
        const isSkipped = item?.isSkipped || !answerText;

        if (!questionId || !validQuestionIds.has(questionId)) {
          continue;
        }

        // Upsert answer
        await Answer.findOneAndUpdate(
          {
            interview: interviewId,
            question: questionId,
          },
          {
            answerText,
            status: isSkipped ? 'skipped' : 'answered',
            timeTaken: Number(item?.timeTaken) || 0,
            mode: item?.mode || 'text',
            submittedAt: new Date(),
          },
          {
            upsert: true,
            new: true,
          }
        );
      }
    }

    // CRITICAL: Validate that at least some questions were answered before completion
    const totalQuestions = await Question.countDocuments({ interview: interviewId });
    const answeredQuestions = await Answer.countDocuments({ 
      interview: interviewId,
      status: 'answered'
    });

    console.log('[interview.complete] Answer validation', {
      totalQuestions,
      answeredQuestions,
      skippedQuestions: totalQuestions - answeredQuestions
    });

    if (answeredQuestions === 0) {
      throw new AppError('At least one question must be answered to complete the interview', 400);
    }

    // Mark interview as completed (but NOT evaluated yet)
    interview.status = 'completed';
    interview.completedAt = new Date();
    await interview.save();

    console.log('[interview.complete] Interview marked as completed', { 
      interviewId: interview._id.toString(),
      status: interview.status 
    });

    // Update session
    const session = await InterviewSession.findOne({ interview: interviewId, user: userId });
    if (session) {
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();
    }

    // CRITICAL: Trigger evaluation and ENSURE it completes successfully
    // If evaluation fails, we rollback the completed status
    let evaluation = null;
    try {
      evaluation = await evaluationService.evaluateInterview(interview._id, userId);
      console.log('[interview.complete] Evaluation generated successfully', { 
        evaluationId: evaluation._id?.toString?.(),
        overallScore: evaluation.overallScore 
      });
    } catch (evalError) {
      // CRITICAL: If evaluation fails, rollback interview to in-progress
      console.error('[interview.complete] Evaluation failed - rolling back completion', {
        error: evalError?.message || evalError,
        interviewId: interview._id.toString()
      });
      
      interview.status = 'in-progress';
      interview.completedAt = null;
      await interview.save();

      if (session) {
        session.status = 'in-progress';
        session.completedAt = null;
        await session.save();
      }

      throw new AppError(
        evalError?.message || 'Failed to generate evaluation. Please try again.',
        evalError?.statusCode || 500
      );
    }

    return {
      interview,
      evaluation
    };
  }

  async logSuspiciousActivity(interviewId, userId, payload = {}) {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    const session = await InterviewSession.findOne({ interview: interviewId, user: userId });
    if (!session) {
      throw new AppError('Interview session not found', 404);
    }

    session.suspiciousActivities.push({
      type: payload?.type || 'other',
      message: payload?.message || 'Suspicious activity detected',
      metadata: payload?.metadata || null,
      occurredAt: payload?.occurredAt ? new Date(payload.occurredAt) : new Date(),
    });

    await session.save();

    return {
      count: session.suspiciousActivities.length,
      latest: session.suspiciousActivities[session.suspiciousActivities.length - 1],
    };
  }

  async getInterview(interviewId, userId) {
    const interview = await Interview.findOne({ _id: interviewId, user: userId })
      .populate('resume')
      .populate('user', 'name email');

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    const questions = await Question.find({ interview: interviewId }).sort({
      questionNumber: 1,
    });

    const answers = await Answer.find({ interview: interviewId });

    const session = await InterviewSession.findOne({
      interview: interviewId,
      user: userId,
    });

    return {
      interview,
      questions,
      answers,
      session,
    };
  }

  async getUserInterviews(userId, query) {
    const { page = 1, limit = 10, status } = query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const interviews = await Interview.find(filter)
      .populate('resume', 'filename')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Interview.countDocuments(filter);

    return {
      interviews,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalInterviews: count,
    };
  }

  async generateFromResume(userId, payload) {
    const {
      resumeId,
      jobRole,
      difficulty = 'intermediate',
      numberOfQuestions = 8,
    } = payload;

    if (!resumeId || !jobRole) {
      throw new AppError('resumeId and jobRole are required', 400);
    }

    const resume = await Resume.findOne({ _id: resumeId, user: userId });
    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    const experienceLevel = difficulty === 'hard'
      ? 'experienced'
      : difficulty === 'easy'
      ? 'fresher'
      : 'intermediate';

    const aiQuestions = await aiService.generateInterviewQuestions(
      jobRole,
      experienceLevel,
      Math.max(3, Math.min(Number(numberOfQuestions) || 8, 15)),
      resume.extractedText || ''
    );

    return {
      questions: aiQuestions.map((item) => ({
        question: item.questionText,
        type: item.category || 'general',
        difficulty: item.difficulty || difficulty,
      })),
    };
  }

  async saveRecording(userId, payload, recordingFile) {
    const { interviewId } = payload;

    if (!interviewId) {
      throw new AppError('interviewId is required', 400);
    }

    if (!recordingFile) {
      throw new AppError('Recording file is required', 400);
    }

    const interview = await Interview.findOne({ _id: interviewId, user: userId });
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    let mediaUrl = recordingFile.path;
    let cloudinaryPublicId = null;

    try {
      if (isCloudinaryConfigured()) {
        const uploadResult = await cloudinary.uploader.upload(recordingFile.path, {
          folder: 'interviewiq/recordings',
          resource_type: 'auto',
        });

        mediaUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id;

        await fs.unlink(recordingFile.path).catch(() => {});
      }

      const saved = await InterviewRecording.create({
        interview: interviewId,
        user: userId,
        mediaUrl,
        cloudinaryPublicId,
        mimeType: recordingFile.mimetype,
        size: recordingFile.size,
      });

      return saved;
    } catch (error) {
      throw error;
    }
  }

  async deleteInterview(interviewId, userId) {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Delete related questions and answers
    await Question.deleteMany({ interview: interviewId });
    await Answer.deleteMany({ interview: interviewId });
    await Interview.findByIdAndDelete(interviewId);

    return {
      message: 'Interview deleted successfully',
    };
  }
}

export default new InterviewService();
