import '../envBootstrap.js';
import fs from 'fs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import RagChunk from '../src/models/RagChunk.js';
import { chunkText, embedTexts } from '../src/services/rag.service.js';
const files = ['ragCorpus.json', 'ragCorpus.extra.json'];
const docs = files.flatMap((f) =>
  JSON.parse(fs.readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
);
const bad = docs.filter((d) => !d.id || !d.topic || !d.text);
if (bad.length) {
  console.error('Invalid docs:', bad.map((d) => d.id));
  process.exit(1);
}

await connectDB();
await RagChunk.deleteMany({ sourceType: { $ne: 'pdf' } });

let total = 0;
let embedded = 0;
for (const d of docs) {
  const chunks = chunkText(d.text);
  const vectors = await embedTexts(chunks.map((c) => `${d.title}. ${c}`));
  const rows = chunks.map((text, i) => ({
    docId: d.id, chunkIndex: i, topic: d.topic, title: d.title, text,
    embedding: vectors ? vectors[i] : [],
  }));
  await RagChunk.insertMany(rows);
  total += rows.length;
  if (vectors) embedded += rows.length;
}

console.log(`Ingested ${docs.length} documents -> ${total} chunks (${embedded} with embeddings).`);
if (!embedded) console.log('No embeddings: the model could not load. Retrieval will use BM25 only.');
await mongoose.disconnect();
process.exit(0);