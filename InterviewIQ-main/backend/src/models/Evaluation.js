import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    categoryScores: {
      technical: { type: Number, min: 0, max: 100 },
      communication: { type: Number, min: 0, max: 100 },
      problemSolving: { type: Number, min: 0, max: 100 },
      confidence: { type: Number, min: 0, max: 100 },
    },
    questionEvaluations: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        answer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Answer',
        },
        score: {
          type: Number,
          min: 0,
          max: 10,
        },
        feedback: String,
        strengths: [String],
        improvements: [String],
      },
    ],
    overallFeedback: {
      strengths: [String],
      improvements: [String],
      recommendations: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
evaluationSchema.index({ user: 1, createdAt: -1 });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation;
