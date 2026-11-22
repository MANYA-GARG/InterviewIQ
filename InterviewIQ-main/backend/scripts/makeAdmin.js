import '../envBootstrap.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../src/models/User.js';

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/makeAdmin.js user@example.com');
  process.exit(1);
}
await connectDB();
const res = await User.updateOne({ email }, { $set: { role: 'admin' } });
console.log(res.matchedCount ? `${email} is now an admin.` : `No user found with email ${email}. Register first.`);
await mongoose.disconnect();
process.exit(0);