import '../envBootstrap.js';
import fs from 'fs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import AbilityTrace from '../src/models/AbilityTrace.js';
import AssessmentSession from '../src/models/AssessmentSession.js';
import { computeAgreement } from '../src/services/evidence.service.js';
import { mean } from '../src/utils/stats.js';

const f = (v, d = 3) => (v === null || v === undefined ? 'n/a' : Number(v).toFixed(d));
const pct = (a, p) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)];
};
const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

await connectDB();
const out = [];

const ag = await computeAgreement();
out.push('Table 5.1', `n = ${ag.overall.n}`, `Spearman = ${f(ag.overall.spearman)}`,
  `95% CI = ${ag.overall.ci95 ? `${f(ag.overall.ci95[0])} to ${f(ag.overall.ci95[1])}` : 'n/a (need 8+ answers)'}`,
  `MAE = ${f(ag.overall.mae)}`);
for (const [d, v] of Object.entries(ag.byDimension)) out.push(`${d} correlation = ${f(v.spearman)} (n=${v.n})`);

out.push('', 'Table 5.2', `raters = ${ag.coverage.raters}`, `rated answers = ${ag.coverage.ratedAnswers}`,
  `rated by 2+ = ${ag.coverage.ratedByTwoPlus}`, `mean Spearman across pairs = ${f(ag.interRater.meanSpearman)}`,
  `weighted kappa = ${f(ag.interRater.meanKappa)}`);

const st = readJson('evidence_out/stability.json');
out.push('', 'Table 5.3');
if (st) {
  const sds = st.rows.map((r) => r.sd);
  const ok = sds.filter((x) => x <= 0.1).length;
  out.push(`runs = ${st.summary.runsEach}`, `answers = ${st.rows.length}`, `mean SD = ${f(mean(sds))}`,
    `max range = ${f(Math.max(...st.rows.map((r) => r.range)))}`,
    `answers with SD <= 0.1 = ${ok} (${f((ok / st.rows.length) * 100, 1)}%)`,
    `fallback runs = ${st.summary.fallbackRuns}`);
} else out.push('missing evidence_out/stability.json: run stabilityTest.js');

const ab = readJson('evidence_out/ablation.json');
out.push('', 'Table 5.4');
if (ab) ab.table.forEach((r) => out.push(`${r.mode}: rho=${r.spearman}  MAE=${r.mae}  CI=${r.ci95}  n=${r.n}`));
else out.push('missing evidence_out/ablation.json: run ablation.js');

const session = await AssessmentSession.findOne({ status: 'completed' }).sort({ createdAt: -1 });
out.push('', 'Table 5.5 (latest completed session)');
if (session) {
  const tr = await AbilityTrace.find({ session: session._id }).sort({ step: 1 }).lean();
  tr.slice(0, 8).forEach((t) =>
    out.push(`| ${t.step} | ${t.topic} | ${t.difficulty} | ${f(t.thetaBefore)} | ${f(t.score, 2)} | ${f(t.thetaAfter)} | ${f(t.seAfter)} |`));
} else out.push('no completed assessment session yet');

const lat = (await AbilityTrace.find({ latencyMs: { $ne: null }, method: 'llm' }).select('latencyMs').lean()).map((t) => t.latencyMs);
out.push('', 'Table 5.9 (LLM-scored answers, ms)');
if (lat.length) out.push(`n = ${lat.length}`, `mean = ${f(mean(lat), 0)}`, `median = ${f(pct(lat, 0.5), 0)}`,
  `min = ${Math.min(...lat)}`, `max = ${Math.max(...lat)}`, `p95 = ${f(pct(lat, 0.95), 0)}`);
else out.push('no latency data: run new assessments after adding latencyMs');

console.log(out.join('\n'));
fs.mkdirSync('evidence_out', { recursive: true });
fs.writeFileSync('evidence_out/report_tables.txt', out.join('\n'));
await mongoose.disconnect();
process.exit(0);