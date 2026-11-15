import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    answerText: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    // Question status tracking
    status: {
      type: String,
      enum: ['answered', 'skipped'],
      default: 'answered',
    },
    // Voice mode fields
    audioUrl: {
      type: String,
    },
    cloudinaryPublicId: {
      type: String,
    },
    transcript: {
      type: String,
    },
    // Evaluation scores
    scores: {
      technical: {
        type: Number,
        min: 0,
        max: 10,
      },
      clarity: {
        type: Number,
        min: 0,
        max: 10,
      },
      depth: {
        type: Number,
        min: 0,
        max: 10,
      },
      communication: {
        type: Number,
        min: 0,
        max: 10,
      },
      final: {
        type: Number,
        min: 0,
        max: 10,
      },
    },
    feedback: {
      type: String,
    },
    timeTaken: {
      type: Number, // in seconds
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
answerSchema.index({ interview: 1 });
answerSchema.index({ question: 1 });

const Answer = mongoose.model('Answer', answerSchema);

export default Answer;
