import mongoose from 'mongoose';
import AbilityTrace from '../models/AbilityTrace.js';
import BankQuestion from '../models/BankQuestion.js';
import HumanRating from '../models/HumanRating.js';
import AppError from '../utils/AppError.js';
import { mean, spearman, bootstrapCI, weightedKappa, mae } from '../utils/stats.js';

const MAX_RATERS = 3;
export const DIMS = ['correctness', 'depth', 'completeness', 'communication'];
// Same weights as the AI evaluator, so the two overall scores are comparable
const W = { correctness: 0.4, depth: 0.2, completeness: 0.25, communication: 0.15 };

const r3 = (n) => (n === null || n === undefined ? null : Math.round(n * 1000) / 1000);
export const humanOverall = (r) => DIMS.reduce((s, d) => s + r[d] * W[d], 0) / 10;
const bin = (x) => Math.min(4, Math.floor(x * 5));
const avgOrNull = (arr) => {
  const v = arr.filter((x) => x !== null && x !== undefined);
  return v.length ? r3(mean(v)) : null;
};

/** Traces that have at least one human rating, with the human mean attached. */
export async function loadRated() {
  const ratings = await HumanRating.find().lean();
  const grouped = new Map();
  for (const r of ratings) {
    const key = String(r.trace);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
  }
  const traces = await AbilityTrace.find({ _id: { $in: [...grouped.keys()] } }).lean();
  return traces.map((trace) => {
    const rs = grouped.get(String(trace._id));
    const dims = {};
    DIMS.forEach((d) => { dims[d] = mean(rs.map((r) => r[d])); });
    return { trace, ratings: rs, human: { n: rs.length, dims, overall: mean(rs.map(humanOverall)) } };
  });
}

export async function computeAgreement() {
  const rateable = await AbilityTrace.countDocuments({
    answerText: { $exists: true, $ne: '' },
    method: { $ne: 'rejected' },
  });
  const items = (await loadRated()).filter(
    (i) => typeof i.trace.score === 'number' && i.trace.method !== 'rejected'
  );

  const coverage = {
    rateableAnswers: rateable,
    ratedAnswers: items.length,
    ratedByTwoPlus: items.filter((i) => i.human.n >= 2).length,
    raters: new Set(items.flatMap((i) => i.ratings.map((r) => String(r.rater)))).size,
  };

  const hx = items.map((i) => i.human.overall);
  const ay = items.map((i) => i.trace.score);
  const overall = {
    n: items.length,
    spearman: r3(spearman(hx, ay)),
    ci95: items.length >= 8 ? bootstrapCI(hx, ay).map(r3) : null,
    mae: r3(mae(hx, ay)),
  };

  const byDimension = {};
  for (const d of DIMS) {
    const sub = items.filter((i) => typeof i.trace.rubric?.[d] === 'number');
    byDimension[d] = {
      n: sub.length,
      spearman: r3(spearman(sub.map((i) => i.human.dims[d]), sub.map((i) => i.trace.rubric[d]))),
    };
  }

  // Inter-rater agreement between every pair of raters
  const byRater = new Map();
  for (const i of items) {
    for (const r of i.ratings) {
      const k = String(r.rater);
      if (!byRater.has(k)) byRater.set(k, new Map());
      byRater.get(k).set(String(i.trace._id), humanOverall(r));
    }
  }
  const ids = [...byRater.keys()];
  const detail = [];
  for (let a = 0; a < ids.length; a += 1) {
    for (let b = a + 1; b < ids.length; b += 1) {
      const A = byRater.get(ids[a]);
      const B = byRater.get(ids[b]);
      const shared = [...A.keys()].filter((k) => B.has(k));
      if (shared.length < 5) continue;
      detail.push({
        n: shared.length,
        spearman: r3(spearman(shared.map((k) => A.get(k)), shared.map((k) => B.get(k)))),
        kappa: r3(weightedKappa(shared.map((k) => bin(A.get(k))), shared.map((k) => bin(B.get(k))))),
      });
    }
  }
  const interRater = {
    pairs: detail.length,
    meanSpearman: avgOrNull(detail.map((d) => d.spearman)),
    meanKappa: avgOrNull(detail.map((d) => d.kappa)),
    detail,
  };

  return { coverage, overall, byDimension, interRater };
}

class EvidenceService {
  /** Next answer for this rater. Blind: AI scores are never sent. */
  async next(raterId, { includeOwn = false, skip = [] } = {}) {
    const rated = await HumanRating.distinct('trace', { rater: raterId });
    const counts = await HumanRating.aggregate([{ $group: { _id: '$trace', n: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.n]));

    const exclude = [...rated, ...skip.filter((s) => mongoose.Types.ObjectId.isValid(s))];
    const query = {
      answerText: { $exists: true, $ne: '' },
      method: { $ne: 'rejected' },
      _id: { $nin: exclude },
    };
    if (!includeOwn) query.user = { $ne: raterId };

    const pool = await AbilityTrace.find(query).select('question answerText').limit(300).lean();
    const open = pool.filter((t) => (countMap.get(String(t._id)) || 0) < MAX_RATERS);
    // Fewest ratings first so every answer reaches 2-3 raters
    open.sort(
      (a, b) =>
        (countMap.get(String(a._id)) || 0) - (countMap.get(String(b._id)) || 0) ||
        Math.random() - 0.5
    );

    const progress = { mine: rated.length, remaining: open.length };
    const pick = open[0];
    if (!pick) return { item: null, progress };

    const q = await BankQuestion.findById(pick.question).select('question keyPoints topic difficulty').lean();
    return {
      item: {
        id: pick._id,
        answer: pick.answerText,
        question: q?.question || '',
        keyPoints: q?.keyPoints || [],
        topic: q?.topic || '',
        difficulty: q?.difficulty || null,
      },
      progress,
    };
  }

  async rate(raterId, body = {}) {
    const { traceId } = body;
    if (!mongoose.Types.ObjectId.isValid(traceId)) throw new AppError('Invalid answer id', 400);

    const scores = {};
    for (const d of DIMS) {
      const v = Number(body[d]);
      if (!Number.isInteger(v) || v < 0 || v > 10) {
        throw new AppError(`${d} must be a whole number from 0 to 10`, 400);
      }
      scores[d] = v;
    }

    const trace = await AbilityTrace.findById(traceId).select('answerText');
    if (!trace?.answerText) throw new AppError('Answer not found', 404);

    await HumanRating.findOneAndUpdate(
      { trace: traceId, rater: raterId },
      { $set: scores },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return { saved: true };
  }
}

export default new EvidenceService();