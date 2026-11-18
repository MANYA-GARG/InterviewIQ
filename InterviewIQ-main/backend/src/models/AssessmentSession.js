import mongoose from 'mongoose';

const assessmentSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    maxQuestions: { type: Number, default: 8 },
    seThreshold: { type: Number, default: 0.6 },
    useRag: { type: Boolean, default: true },
    asked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BankQuestion' }],
    current: { type: mongoose.Schema.Types.ObjectId, ref: 'BankQuestion', default: null },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    stopReason: { type: String, default: '' },
    summary: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

assessmentSessionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('AssessmentSession', assessmentSessionSchema);