import '../envBootstrap.js';
import fs from 'fs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { computeAgreement } from '../src/services/evidence.service.js';

await connectDB();
const res = await computeAgreement();

console.log('\nCoverage:', res.coverage);
console.log('\nAI vs human (overall):', res.overall);
console.log('\nAI vs human by dimension:');
console.table(res.byDimension);
console.log('\nInter-rater agreement:', {
  pairs: res.interRater.pairs,
  meanSpearman: res.interRater.meanSpearman,
  meanKappa: res.interRater.meanKappa,
});

fs.mkdirSync('evidence_out', { recursive: true });
fs.writeFileSync('evidence_out/agreement.json', JSON.stringify(res, null, 2));
console.log('\nSaved evidence_out/agreement.json');

await mongoose.disconnect();
process.exit(0);