import '../envBootstrap.js';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import connectDB from '../config/db.js';
import RagChunk from '../src/models/RagChunk.js';
import { chunkSentences, embedTexts } from '../src/services/rag.service.js';

const root = path.resolve('rag_docs');
if (!fs.existsSync(root)) {
  console.error('Create backend/rag_docs/<topic>/ folders with PDFs first.');
  process.exit(1);
}

const clean = (t) =>
  t.replace(/\r/g, '')
    .replace(/-\n(?=[a-z])/g, '')
    .split('\n')
    .filter((l) => !/^\s*(page\s*)?\d{1,4}\s*$/i.test(l))
    .join('\n')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

await connectDB();
await RagChunk.deleteMany({ sourceType: 'pdf' });

let files = 0, total = 0, embedded = 0;
for (const topic of fs.readdirSync(root)) {
  const dir = path.join(root, topic);
  if (!fs.statSync(dir).isDirectory()) continue;

  for (const file of fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf'))) {
    const parsed = await pdfParse(fs.readFileSync(path.join(dir, file)));
    const text = clean(parsed.text);
    const chunks = chunkSentences(text);
    if (!chunks.length) { console.warn(`No text in ${topic}/${file} (scanned PDF?)`); continue; }

    const title = file.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ');
    const vectors = await embedTexts(chunks.map((c) => `${title}. ${c}`));
    await RagChunk.insertMany(chunks.map((c, i) => ({
      docId: `pdf-${topic}-${file}`, chunkIndex: i, topic, title, text: c,
      source: `${topic}/${file}`, sourceType: 'pdf',
      embedding: vectors ? vectors[i] : [],
    })));
    files += 1; total += chunks.length; if (vectors) embedded += chunks.length;
    console.log(`${topic}/${file}: ${parsed.numpages} pages -> ${chunks.length} chunks`);
  }
}
console.log(`\nIngested ${files} PDFs -> ${total} chunks (${embedded} embedded).`);
await mongoose.disconnect();
process.exit(0);