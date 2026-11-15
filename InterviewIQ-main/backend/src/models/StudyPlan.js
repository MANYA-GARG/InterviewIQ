import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['learn', 'practice', 'review', 'mock'], default: 'learn' },
    minutes: { type: Number, default: 30 },
    query: { type: String, default: '' },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: Number,
    focus: String,
    tasks: [taskSchema],
  },
  { _id: false }
);

const studyPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', default: null },
    role: { type: String, default: '' },
    summary: { type: String, default: '' },
    weakAreas: [{ area: String, reason: String, _id: false }],
    days: [daySchema],
    source: { type: String, enum: ['ai', 'rules'], default: 'ai' },
  },
  { timestamps: true }
);

studyPlanSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('StudyPlan', studyPlanSchema);