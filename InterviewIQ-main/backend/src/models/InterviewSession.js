import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questionQueue: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    mode: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    timerDuration: {
      type: Number, // in seconds
      default: 120,
      min: 60,
      max: 180,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    suspiciousActivities: [
      {
        type: {
          type: String,
          enum: ['tab-hidden', 'window-blur', 'camera-off', 'microphone-off', 'other'],
          default: 'other',
        },
        message: {
          type: String,
          trim: true,
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        occurredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

interviewSessionSchema.index({ interview: 1, user: 1 });
interviewSessionSchema.index({ user: 1, createdAt: -1 });

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;
