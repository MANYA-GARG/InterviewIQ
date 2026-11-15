import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    resumeUrl: { type: String },
    score: { type: Number, min: 0, max: 100, default: 0 },
    structureScore: { type: Number, min: 0, max: 100 },
    experienceScore: { type: Number, min: 0, max: 100 },
    skillsScore: { type: Number, min: 0, max: 100 },
    achievementsScore: { type: Number, min: 0, max: 100 },
    summary: { type: String, default: '' },
    strengths: [String],
    weaknesses: [String],
    improvedBullets: [{ original: String, improved: String, _id: false }],
    aiPowered: { type: Boolean, default: false },
    detectedSkills: [String],
    missingSkills: [String],
    suggestions: [String],
    wordCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ userId: 1, resumeId: 1 });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

export default ResumeAnalysis;