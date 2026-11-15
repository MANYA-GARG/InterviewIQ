import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['technical', 'behavioral', 'scenario-based', 'general'],
      default: 'technical',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    expectedAnswer: String,
    isFollowUp: {
      type: Boolean,
      default: false,
    },
    parentQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      default: null,
    },
    followUpReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ interview: 1, questionNumber: 1 });
questionSchema.index({ parentQuestion: 1 });

const Question = mongoose.model('Question', questionSchema);

export default Question;