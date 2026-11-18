// Usage: node scripts/stabilityTest.js --n 10 --runs 5 --rag true
import '../envBootstrap.js';
import fs from 'fs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import AbilityTrace from '../src/models/AbilityTrace.js';
import BankQuestion from '../src/models/BankQuestion.js';
import rubric from '../src/services/rubricEvaluator.service.js';
import rag from '../src/services/rag.service.js';
import { mean, sd } from '../src/utils/stats.js';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const n = Number(arg('n', 10));
const runs = Number(arg('runs', 5));
const useRag = arg('rag', 'true') !== 'false';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await connectDB();
const traces = await AbilityTrace.find({
  answerText: { $exists: true, $ne: '' },
  method: { $ne: 'rejected' },
}).limit(200).lean();

if (!traces.length) {
  console.error('No saved answers yet. Run a new assessment first.');
  process.exit(1);
}

const sample = traces.sort(() => Math.random() - 0.5).slice(0, n);
const rows = [];
let fallbackRuns = 0;

for (const t of sample) {
  const q = await BankQuestion.findById(t.question);
  if (!q) continue;
  let chunks = [];
  if (useRag) {
    const found = await rag.retrieve(`${q.question} ${(q.keyPoints || []).join(' ')}`, { topic: q.topic, k: 3 });
    chunks = found.map((c) => c.text);
  }
  const scores = [];
  for (let r = 0; r < runs; r += 1) {
    const res = await rubric.evaluate({ question: q, answer: t.answerText, referenceChunks: chunks });
    if (res.method !== 'llm') fallbackRuns += 1;
    scores.push(res.overall);
    await sleep(300);
  }
  rows.push({
    qid: q.qid,
    mean: Math.round(mean(scores) * 100) / 100,
    sd: Math.round(sd(scores) * 1000) / 1000,
    range: Math.round((Math.max(...scores) - Math.min(...scores)) * 100) / 100,
    scores: scores.join(' '),
  });
}

console.table(rows);
const summary = {
  answers: rows.length,
  runsEach: runs,
  rag: useRag,
  meanSD: Math.round(mean(rows.map((r) => r.sd)) * 1000) / 1000,
  maxRange: Math.max(...rows.map((r) => r.range)),
  answersWithin0_1: rows.filter((r) => r.range <= 0.1).length,
  fallbackRuns,
};
console.log('\nSummary:', summary);
if (fallbackRuns) console.log('WARNING: some runs used the keyword fallback (LLM failed), so the result is not pure.');

fs.mkdirSync('evidence_out', { recursive: true });
fs.writeFileSync('evidence_out/stability.json', JSON.stringify({ summary, rows }, null, 2));
await mongoose.disconnect();
process.exit(0);