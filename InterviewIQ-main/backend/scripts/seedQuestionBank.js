import '../envBootstrap.js';
import fs from 'fs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import BankQuestion from '../src/models/BankQuestion.js';

const files = ['assessmentBank.json', 'assessmentBank.extra.json'];
const items = files.flatMap((f) =>
  JSON.parse(fs.readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
);
const seen = new Set();
for (const q of items) {
  if (seen.has(q.qid)) { console.error('Duplicate qid:', q.qid); process.exit(1); }
  seen.add(q.qid);
}
const bad = items.filter(
  (q) =>
    !q.qid || !q.role || !q.topic || !q.question ||
    !(q.difficulty >= 1 && q.difficulty <= 5) ||
    !Array.isArray(q.key_points) || q.key_points.length < 2
);
if (bad.length) {
  console.error('Invalid entries:', bad.map((q) => q.qid || q.question));
  process.exit(1);
}

await connectDB();

let count = 0;
for (const q of items) {
  await BankQuestion.updateOne(
    { qid: q.qid },
    {
      $set: {
        role: q.role, topic: q.topic, subtopic: q.subtopic || '',
        difficulty: q.difficulty, type: q.type || 'technical',
        question: q.question, keyPoints: q.key_points,
        modelAnswer: q.model_answer || '', tags: q.tags || [], reviewed: true,
      },
    },
    { upsert: true }
  );
  count += 1;
}

const byTopic = await BankQuestion.aggregate([
  { $group: { _id: { role: '$role', topic: '$topic', d: '$difficulty' }, n: { $sum: 1 } } },
  { $sort: { '_id.role': 1, '_id.topic': 1, '_id.d': 1 } },
]);
console.log(`Seeded ${count} questions.`);
console.table(byTopic.map((r) => ({ role: r._id.role, topic: r._id.topic, difficulty: r._id.d, count: r.n })));

await mongoose.disconnect();
process.exit(0);