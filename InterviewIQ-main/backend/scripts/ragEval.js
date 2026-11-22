import '../envBootstrap.js';
import fs from 'fs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import rag from '../src/services/rag.service.js';

const K = 3;

const items = JSON.parse(
  fs.readFileSync(
    new URL('../src/data/ragEval.json', import.meta.url),
    'utf8'
  )
);

await connectDB();

const rows = [];

for (const mode of ['bm25', 'dense', 'hybrid']) {
  let hit = 0;
  let recall = 0;
  let mrr = 0;

  for (const it of items) {
    const res = await rag.retrieve(it.query, {
      topic: it.topic,
      k: K,
      mode
    });

    const ids = res.map((r) => r.docId);
    const found = it.relevant.filter((d) => ids.includes(d));

    if (found.length) hit += 1;

    recall += found.length / it.relevant.length;

    const first = ids.findIndex((d) => it.relevant.includes(d));

    if (first >= 0) mrr += 1 / (first + 1);
  }

  const n = items.length;

  rows.push({
    mode,
    queries: n,
    [`hit@${K}`]: +(hit / n).toFixed(3),
    [`recall@${K}`]: +(recall / n).toFixed(3),
    MRR: +(mrr / n).toFixed(3)
  });
}

console.table(rows);

fs.mkdirSync('evidence_out', { recursive: true });

fs.writeFileSync(
  'evidence_out/rag_eval.json',
  JSON.stringify(rows, null, 2)
);

await mongoose.disconnect();
process.exit(0);