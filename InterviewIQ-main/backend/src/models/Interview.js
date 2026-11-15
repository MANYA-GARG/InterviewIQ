import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    jobRole: {
      type: String,
      required: true,
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ['fresher', 'intermediate', 'experienced'],
      required: true,
    },
    numberOfQuestions: {
      type: Number,
      default: 5,
      min: 3,
      max: 15,
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
      enum: ['pending', 'in-progress', 'completed', 'evaluated'],
      default: 'pending',
    },
    startedAt: Date,
    completedAt: Date,
    evaluationReport: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;
