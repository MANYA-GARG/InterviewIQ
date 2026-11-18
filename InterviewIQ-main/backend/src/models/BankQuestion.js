import mongoose from 'mongoose';

const bankQuestionSchema = new mongoose.Schema(
  {
    qid: { type: String, required: true, unique: true },
    role: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    subtopic: { type: String, default: '' },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    type: { type: String, enum: ['technical', 'behavioral'], default: 'technical' },
    question: { type: String, required: true },
    keyPoints: [String],
    modelAnswer: { type: String, default: '' },
    tags: [String],
    reviewed: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'bank_questions' }
);

export default mongoose.model('BankQuestion', bankQuestionSchema);