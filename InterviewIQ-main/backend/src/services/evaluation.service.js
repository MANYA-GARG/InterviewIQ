import Evaluation from '../models/Evaluation.js';
import Interview from '../models/Interview.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import aiService from './ai.service.js';
import answerAnalysisService from './answerAnalysis.service.js';
import AppError from '../utils/AppError.js';

const toScore = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : fallback;
};

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(n)));

// Rejects empty, too-short and gibberish answers before they reach the AI
const isMeaningful = (text = '') => {
  const t = String(text).trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  const compact = t.replace(/\s/g, '');
  const letters = (t.match(/[a-z]/gi) || []).length;
  if (!compact.length || letters / compact.length < 0.6) return false;
  const wordsWithVowel = words.filter((w) => /[aeiou]/i.test(w)).length;
  return wordsWithVowel / words.length >= 0.5;
};

const ZERO_METRICS = { structure: 0, length: 0, keyword: 0, confidence: 0 };

class EvaluationService {
  async evaluateInterview(interviewId, userId) {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (interview.status !== 'completed') {
      throw new AppError('Interview must be completed before evaluation', 400);
    }

    const existingEvaluation = await Evaluation.findOne({ interview: interviewId });
    if (existingEvaluation) {
      return existingEvaluation;
    }

    try {
      const questions = await Question.find({ interview: interviewId }).sort({
        questionNumber: 1,
      });
      const answers = await Answer.find({ interview: interviewId });

      const answerMap = {};
      answers.forEach((answer) => {
        answerMap[answer.question.toString()] = answer;
      });

      const questionEvaluations = [];
      const allScores = []; // 0-10, one per evaluated answer
      const metrics = []; // measured 0-100 values, one per evaluated answer

      for (const question of questions) {
        const answer = answerMap[question._id.toString()];
        const text = (answer?.answerText || answer?.transcript || '').trim();

        // Skipped or empty: contributes nothing (counts as 0 in the overall score)
        if (!answer || answer.status === 'skipped' || !text) {
          continue;
        }

        // Gibberish or one-word answers never reach the AI
        if (!isMeaningful(text)) {
          allScores.push(0);
          metrics.push(ZERO_METRICS);
          questionEvaluations.push({
            question: question._id,
            answer: answer._id,
            score: 0,
            feedback: 'The answer was too short or not meaningful, so it could not be scored.',
            strengths: [],
            improvements: ['Write a complete answer with at least a few sentences.'],
          });
          continue;
        }

        // Measured delivery metrics (no AI): structure, length, keywords, confidence
        let m = ZERO_METRICS;
        try {
          const local = await answerAnalysisService.analyzeAnswer(
            question.questionText,
            text,
            question.expectedAnswer || ''
          );
          m = {
            structure: local.localAnalysis.structureScore,
            length: local.localAnalysis.lengthScore,
            keyword: local.localAnalysis.keywordScore,
            confidence: local.localAnalysis.confidenceScore,
          };
        } catch (e) {
          console.error('[evaluation] local analysis failed:', e?.message || e);
        }

        try {
          let aiEvaluation;
          let score;

          if (answer.mode === 'voice' && answer.transcript) {
            aiEvaluation = await aiService.evaluateVoiceAnswer(
              question.questionText,
              answer.transcript,
              question.expectedAnswer
            );
            score = toScore(aiEvaluation.final);

            answer.scores = {
              technical: toScore(aiEvaluation.technical),
              clarity: toScore(aiEvaluation.clarity),
              depth: toScore(aiEvaluation.depth),
              communication: toScore(aiEvaluation.communication),
              final: score,
            };
            answer.feedback = aiEvaluation.feedback || '';
            await answer.save();
          } else {
            aiEvaluation = await aiService.evaluateAnswer(
              question.questionText,
              text,
              question.expectedAnswer
            );
            score = toScore(aiEvaluation.score);
          }

          allScores.push(score);
          metrics.push(m);
          questionEvaluations.push({
            question: question._id,
            answer: answer._id,
            score,
            feedback: aiEvaluation.feedback || '',
            strengths: Array.isArray(aiEvaluation.strengths) ? aiEvaluation.strengths : [],
            improvements: Array.isArray(aiEvaluation.improvements) ? aiEvaluation.improvements : [],
          });
        } catch (evaluationError) {
          console.error('[evaluation] Error evaluating answer:', evaluationError?.message || evaluationError);

          // Heuristic fallback, based on measured metrics only
          const score = toScore(
            (0.5 * m.keyword + 0.25 * m.structure + 0.25 * m.length) / 10
          );
          allScores.push(score);
          metrics.push(m);
          questionEvaluations.push({
            question: question._id,
            answer: answer._id,
            score,
            feedback: 'Automatic scoring was used because AI evaluation was unavailable.',
            strengths: [],
            improvements: ['Cover the key concepts in the question in more detail.'],
          });
        }
      }

         const answeredCount = questionEvaluations.length;
      const followUpIds = new Set(
        questions.filter((q) => q.isFollowUp).map((q) => q._id.toString())
      );
      const answeredFollowUps = questionEvaluations.filter((e) =>
        followUpIds.has(String(e.question))
      ).length;
      // Main questions always count; follow-ups count only if answered
      const total = Math.max(1, questions.length - followUpIds.size + answeredFollowUps);
      const coverage = answeredCount / total;

      // Overall: skipped questions count as 0
      const overallScore = clamp100((allScores.reduce((a, b) => a + b, 0) / total) * 10);

      // Category scores: measured from the answers, scaled by coverage
      const categoryScores = answeredCount
        ? {
            technical: clamp100(avg(allScores) * 10 * coverage),
            communication: clamp100(
              avg(metrics.map((x) => 0.5 * x.structure + 0.5 * x.length)) * coverage
            ),
            problemSolving: clamp100(
              avg(allScores.map((s, i) => 0.6 * s * 10 + 0.4 * metrics[i].keyword)) * coverage
            ),
            confidence: clamp100(avg(metrics.map((x) => x.confidence)) * coverage),
          }
        : { technical: 0, communication: 0, problemSolving: 0, confidence: 0 };

      // Narrative feedback: the AI writes text only, it does not decide any numbers
      let overallFeedback;
      if (answeredCount === 0 || overallScore === 0) {
        overallFeedback = {
          strengths: [],
          improvements: ['No meaningful answers were submitted, so there is nothing to score yet.'],
          recommendations: [
            'Retake the interview and answer each question in a few complete sentences.',
          ],
        };
      } else {
        try {
          overallFeedback = await aiService.generateOverallFeedback(
            questionEvaluations,
            interview.jobRole,
            interview.experienceLevel
          );
        } catch (feedbackError) {
          console.error('[evaluation] Error generating overall feedback:', feedbackError?.message || feedbackError);
          overallFeedback = {
            strengths: ['You completed the interview'],
            improvements: ['Review the question-wise feedback below'],
            recommendations: ['Practice explaining concepts with examples'],
          };
        }
      }

      const evaluation = await Evaluation.create({
        interview: interviewId,
        user: userId,
        overallScore,
        categoryScores,
        questionEvaluations,
        overallFeedback: {
          strengths: overallFeedback.strengths || [],
          improvements: overallFeedback.improvements || [],
          recommendations: overallFeedback.recommendations || [],
        },
      });

      interview.status = 'evaluated';
      interview.evaluationReport = {
        overallScore: evaluation.overallScore,
        categoryScores: evaluation.categoryScores,
        feedback: evaluation.overallFeedback,
        evaluatedAt: new Date(),
      };
      await interview.save();

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