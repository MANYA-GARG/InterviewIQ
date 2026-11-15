import mongoose from 'mongoose';

const resumeDraftSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'My Resume', trim: true, maxlength: 100 },
    template: { type: String, enum: ['classic', 'modern', 'minimal'], default: 'modern' },
    sourceResume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    data: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

resumeDraftSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('ResumeDraft', resumeDraftSchema);