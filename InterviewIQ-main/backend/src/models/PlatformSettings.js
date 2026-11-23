
import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    // Keeps a single global settings document in the database
    key: {
      type: String,
      default: 'global',
      unique: true,
      required: true,
    },

    // Platform-level controls
    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    registrationEnabled: {
      type: Boolean,
      default: true,
    },

    announcement: {
      enabled: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        default: '',
        maxlength: 500,
      },
      type: {
        type: String,
        enum: ['info', 'success', 'warning'],
        default: 'info',
      },
    },

    // AI feature controls
    aiFeatures: {
      interviewQuestionGeneration: {
        type: Boolean,
        default: true,
      },
      interviewEvaluation: {
        type: Boolean,
        default: true,
      },
      interviewFeedback: {
        type: Boolean,
        default: true,
      },
      resumeAnalysis: {
        type: Boolean,
        default: true,
      },
      resumeBuilder: {
        type: Boolean,
        default: true,
      },
      studyPlanGeneration: {
        type: Boolean,
        default: true,
      },
      adaptiveAssessment: {
        type: Boolean,
        default: true,
      },
      answerEvaluation: {
        type: Boolean,
        default: true,
      },
    },

    // Platform limits
    limits: {
      maxInterviewsPerUserPerDay: {
        type: Number,
        default: 10,
        min: 1,
        max: 100,
      },
      maxQuestionsPerInterview: {
        type: Number,
        default: 20,
        min: 1,
        max: 100,
      },
      maxResumeUploadsPerUser: {
        type: Number,
        default: 10,
        min: 1,
        max: 100,
      },
    },

    // Adaptive assessment configuration
    adaptiveAssessment: {
      enabled: {
        type: Boolean,
        default: true,
      },
      minQuestions: {
        type: Number,
        default: 5,
        min: 1,
        max: 50,
      },
      maxQuestions: {
        type: Number,
        default: 15,
        min: 1,
        max: 50,
      },
      standardErrorThreshold: {
        type: Number,
        default: 0.5,
        min: 0.01,
        max: 5,
      },
    },

    // AI provider configuration (does not store API keys)
    aiConfiguration: {
      provider: {
        type: String,
        default: 'groq',
      },
      model: {
        type: String,
        default: '',
      },
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure minQuestions never exceeds maxQuestions
platformSettingsSchema.pre('validate', function () {
  if (
    this.adaptiveAssessment &&
    this.adaptiveAssessment.minQuestions > this.adaptiveAssessment.maxQuestions
  ) {
    this.invalidate(
      'adaptiveAssessment.minQuestions',
      'Minimum questions cannot exceed maximum questions'
    );
  }
});

const PlatformSettings = mongoose.model(
  'PlatformSettings',
  platformSettingsSchema
);

export default PlatformSettings;
