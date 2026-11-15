import Joi from 'joi';

export const createInterviewSchema = Joi.object({
  jobRole: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Job role must be at least 2 characters',
    'any.required': 'Job role is required',
  }),
  experienceLevel: Joi.string()
    .valid('fresher', 'intermediate', 'experienced')
    .required()
    .messages({
      'any.only': 'Experience level must be fresher, intermediate, or experienced',
      'any.required': 'Experience level is required',
    }),
  numberOfQuestions: Joi.number().min(3).max(15).default(5),
  mode: Joi.string().valid('text', 'voice').default('text'),
  timerDuration: Joi.number().min(60).max(180).default(120),
  resumeId: Joi.string().allow('').optional(),
});

export const submitAnswerSchema = Joi.object({
  questionId: Joi.string().required(),
  answerText: Joi.string().min(1).required().messages({
    'string.min': 'Answer cannot be empty',
    'any.required': 'Answer is required',
  }),
  timeTaken: Joi.number().min(0).optional(),
});
