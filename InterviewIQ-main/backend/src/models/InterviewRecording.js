import mongoose from 'mongoose';

const interviewRecordingSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

interviewRecordingSchema.index({ user: 1, interview: 1, createdAt: -1 });

const InterviewRecording = mongoose.model('InterviewRecording', interviewRecordingSchema);

export default InterviewRecording;
