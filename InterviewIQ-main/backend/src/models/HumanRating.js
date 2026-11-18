import mongoose from 'mongoose';

const humanRatingSchema = new mongoose.Schema(
  {
    trace: { type: mongoose.Schema.Types.ObjectId, ref: 'AbilityTrace', required: true },
    rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    correctness: { type: Number, required: true, min: 0, max: 10 },
    depth: { type: Number, required: true, min: 0, max: 10 },
    completeness: { type: Number, required: true, min: 0, max: 10 },
    communication: { type: Number, required: true, min: 0, max: 10 },
  },
  { timestamps: true, collection: 'human_ratings' }
);

humanRatingSchema.index({ trace: 1, rater: 1 }, { unique: true });

export default mongoose.model('HumanRating', humanRatingSchema);