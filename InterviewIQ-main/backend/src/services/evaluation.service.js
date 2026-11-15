import Evaluation from '../models/Evaluation.js';
import Interview from '../models/Interview.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import aiService from './ai.service.js';
import AppError from '../utils/AppError.js';

  const toScore = (v, fallback = 5) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : fallback;
  };

class EvaluationService {
  async evaluateInterview(interviewId, userId) {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.status !== 'completed') {
      throw new AppError('Interview must be completed before evaluation', 400);
    }

    // Check if already evaluated
    const existingEvaluation = await Evaluation.findOne({ interview: interviewId });
    if (existingEvaluation) {
      return existingEvaluation;
    }

    try {
      // Get all questions and answers
      const questions = await Question.find({ interview: interviewId }).sort({
        questionNumber: 1,
      });
      const answers = await Answer.find({ interview: interviewId });

      // Create answer map for easy lookup
      const answerMap = {};
      answers.forEach((answer) => {
        answerMap[answer.question.toString()] = answer;
      });

      // Evaluate each answer using AI (skip skipped questions)
      const questionEvaluations = [];
      const allScores = [];

      for (const question of questions) {
        const answer = answerMap[question._id.toString()];

        // Skip questions with no answer or marked as skipped
        if (!answer || answer.status === 'skipped' || !answer.answerText?.trim()) {
          console.log('[evaluation] Skipping question', { 
            questionId: question._id.toString(),
            hasAnswer: !!answer,
            status: answer?.status 
          });
          continue;
        }

        try {
          let aiEvaluation;
          
          // Use different evaluation method for voice answers
          if (answer.mode === 'voice' && answer.transcript) {
            aiEvaluation = await aiService.evaluateVoiceAnswer(
              question.questionText,
              answer.transcript,
              question.expectedAnswer
            );
            
            // Save scores to answer document
            answer.scores = {
              technical: aiEvaluation.technical || 0,
              clarity: aiEvaluation.clarity || 0,
              depth: aiEvaluation.depth || 0,
              communication: aiEvaluation.communication || 0,
              final: toScore(aiEvaluation.final),
            };
            answer.feedback = aiEvaluation.feedback || 'Good attempt';
            await answer.save();
            
            allScores.push(toScore(aiEvaluation.final));
            questionEvaluations.push({
              question: question._id,
              answer: answer._id,
              score: toScore(aiEvaluation.final),
              feedback: aiEvaluation.feedback || 'Good attempt',
              strengths: aiEvaluation.strengths || [],
              improvements: aiEvaluation.improvements || [],
            });
          } else {
            // Text-based evaluation
            aiEvaluation = await aiService.evaluateAnswer(
              question.questionText,
              answer.answerText,
              question.expectedAnswer
            );
            
            allScores.push(toScore(aiEvaluation.score));
            questionEvaluations.push({
              question: question._id,
              answer: answer._id,
              score: toScore(aiEvaluation.score),
              feedback: aiEvaluation.feedback || 'Good attempt',
              strengths: aiEvaluation.strengths || [],
              improvements: aiEvaluation.improvements || [],
            });
          }
        } catch (evaluationError) {
          console.error('[evaluation] Error evaluating answer:', evaluationError);
          
          // Fallback scoring if AI service fails
          allScores.push(5);
          questionEvaluations.push({
            question: question._id,
            answer: answer._id,
            score: 5,
            feedback: 'Answer submitted successfully',
            strengths: ['Answer provided'],
            improvements: ['Review feedback for improvements'],
          });
        }
      }

      // Calculate overall score
      const overallScore = allScores.length > 0 
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / questions.length) * 10)
        : 0;

      // Generate overall feedback using AI (with fallback)
      let overallFeedback = {};
      try {
        overallFeedback = await aiService.generateOverallFeedback(
          questionEvaluations,
          interview.jobRole,
          interview.experienceLevel
        );
      } catch (feedbackError) {
        console.error('[evaluation] Error generating overall feedback:', feedbackError);
        
        // Fallback feedback
        overallFeedback = {
          overallScore,
          categoryScores: {
            technical: Math.min(overallScore, 100),
            communication: Math.min(overallScore, 100),
            problemSolving: Math.min(overallScore, 100),
            confidence: Math.min(overallScore, 100),
          },
          strengths: ['You participated in the interview'],
          improvements: ['Review the questions and provide detailed answers'],
          recommendations: ['Practice technical concepts and communication skills'],
        };
      }

      // Create evaluation record
      const evaluation = await Evaluation.create({
        interview: interviewId,
        user: userId,
        overallScore: overallScore,
        categoryScores: overallFeedback.categoryScores || {
          technical: overallScore,
          communication: overallScore,
          problemSolving: overallScore,
          confidence: overallScore,
        },
        questionEvaluations,
        overallFeedback: {
          strengths: overallFeedback.strengths || [],
          improvements: overallFeedback.improvements || [],
          recommendations: overallFeedback.recommendations || [],
        },
      });

      // Update interview status to evaluated
      interview.status = 'evaluated';
     interview.evaluationReport = {
    overallScore: evaluation.overallScore,
    categoryScores: evaluation.categoryScores,
    feedback: evaluation.overallFeedback,
    evaluatedAt: new Date(),
  };
      await interview.save();

      console.log('[evaluation] Interview evaluated successfully', {
        interviewId: interview._id.toString(),
        overallScore: evaluation.overallScore,
        evaluationId: evaluation._id.toString(),
      });

      return evaluation;
    } catch (error) {
      console.error('[evaluation] Evaluation failed:', error);
      throw new AppError(error.message || 'Failed to evaluate interview', 500);
    }
  }

  async getEvaluation(interviewId, userId) {
    const evaluation = await Evaluation.findOne({ interview: interviewId, user: userId })
      .populate('interview')
      .populate({
        path: 'questionEvaluations.question',
        select: 'questionText category difficulty',
      })
      .populate({
        path: 'questionEvaluations.answer',
        select: 'answerText timeTaken',
      });

    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    return evaluation;
  }

  async getUserEvaluations(userId, query) {
    const { page = 1, limit = 10 } = query;

    const evaluations = await Evaluation.find({ user: userId })
      .populate('interview', 'jobRole experienceLevel createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Evaluation.countDocuments({ user: userId });

    return {
      evaluations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalEvaluations: count,
    };
  }
}

export default new EvaluationService();
