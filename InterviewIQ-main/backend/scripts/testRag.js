import '../envBootstrap.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import rag from '../src/services/rag.service.js';

await connectDB();
console.log(await rag.stats());

const queries = [
  ['How do I stop a CPU-heavy task from blocking Node?', 'nodejs'],
  ['why is my query doing a collection scan', 'databases'],
  ['retry safely without charging twice', 'api-design'],
];
for (const [q, topic] of queries) {
  const res = await rag.retrieve(q, { topic, k: 3 });
  console.log(`\nQ: ${q}`);
  res.forEach((r) => console.log(`  ${r.score}  ${r.title}  via ${JSON.stringify(r.via)}`));
}
await mongoose.disconnect();
process.exit(0);