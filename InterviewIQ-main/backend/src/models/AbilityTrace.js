import mongoose from 'mongoose';

const abilityTraceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentSession', required: true, index: true },
    step: Number,
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'BankQuestion' },
        latencyMs: { type: Number, default: null },
    qid: String,
    topic: String,
    difficulty: Number,
    b: Number,
    score: Number, // s in [0,1]
    expected: Number, // p
    thetaBefore: Number,
    thetaAfter: Number,
    seBefore: Number,
    seAfter: Number,
    method: String, // llm | fallback | rejected
    answerText: { type: String, default: '' },
    rubric: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true, collection: 'ability_trace' }
);

export default mongoose.model('AbilityTrace', abilityTraceSchema);