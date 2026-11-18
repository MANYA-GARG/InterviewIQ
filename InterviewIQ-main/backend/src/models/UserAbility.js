import mongoose from 'mongoose';

const userAbilitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    // { [topic]: { theta, se, info, n } }
    topics: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    // progress over time: [{ at, session, topics }]
    snapshots: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

userAbilitySchema.index({ user: 1, role: 1 }, { unique: true });

export default mongoose.model('UserAbility', userAbilitySchema);