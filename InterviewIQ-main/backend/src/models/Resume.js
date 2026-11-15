import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    extractedText: {
      type: String,
      required: true,
    },
    skills: [String],
    skillScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    resumeStrength: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    experience: String,
    education: String,
  },
  {
    timestamps: true,
  }
);

// Index for user queries
resumeSchema.index({ user: 1, createdAt: -1 });

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;