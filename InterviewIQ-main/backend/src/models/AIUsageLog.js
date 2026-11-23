
import mongoose from 'mongoose';

const aiUsageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    feature: {
      type: String,
      required: true,
      index: true,
      enum: [
        'interview_question_generation',
        'interview_evaluation',
        'interview_feedback',
        'resume_analysis',
        'resume_builder',
        'study_plan_generation',
        'adaptive_assessment',
        'answer_evaluation',
        'other',
      ],
    },

    provider: {
      type: String,
      default: 'groq',
    },

    model: {
      type: String,
      default: 'unknown',
    },

    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
      index: true,
    },

    latencyMs: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Optional token usage, when available from the AI provider
    tokens: {
      prompt: {
        type: Number,
        default: 0,
        min: 0,
      },
      completion: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Sanitized error information only.
    // Never store prompts, candidate answers, API keys, or stack traces here.
    errorCode: {
      type: String,
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
      maxlength: 500,
    },

    // Optional non-sensitive contextual information
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Analytics query indexes
aiUsageLogSchema.index({ createdAt: -1 });
aiUsageLogSchema.index({ feature: 1, createdAt: -1 });
aiUsageLogSchema.index({ status: 1, createdAt: -1 });
aiUsageLogSchema.index({ user: 1, createdAt: -1 });

const AIUsageLog = mongoose.model('AIUsageLog', aiUsageLogSchema);

export default AIUsageLog;
