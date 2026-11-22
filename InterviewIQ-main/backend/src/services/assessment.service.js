import BankQuestion from '../models/BankQuestion.js';
import UserAbility from '../models/UserAbility.js';
import AbilityTrace from '../models/AbilityTrace.js';
import AssessmentSession from '../models/AssessmentSession.js';
import AppError from '../utils/AppError.js';
import rubric from './rubricEvaluator.service.js';
import rag from './rag.service.js';
import {
  difficultyToB,
  newTopicState,
  updateTopic,
  pickNext,
  stopReason,
  levelOf,
} from '../utils/irt.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r3 = (n) => Math.round(n * 1000) / 1000;

// Never expose key points or the model answer before the user answers
const publicQ = (q) =>
  q && {
    id: q._id,
    qid: q.qid,
    topic: q.topic,
    subtopic: q.subtopic,
    difficulty: q.difficulty,
    type: q.type,
    question: q.question,
  };

class AssessmentService {
  async roles() {
    return BankQuestion.aggregate([
      { $group: { _id: '$role', questions: { $sum: 1 }, topics: { $addToSet: '$topic' } } },
      { $project: { _id: 0, role: '$_id', questions: 1, topics: 1 } },
      { $sort: { role: 1 } },
    ]);
  }

  async start(userId, { role, maxQuestions, seThreshold, useRag } = {}) {
    if (!role) throw new AppError('role is required', 400);
    const candidates = await BankQuestion.find({ role }).select('topic difficulty').lean();
    if (!candidates.length) throw new AppError('No questions available for this role', 400);

    const ability = await UserAbility.findOne({ user: userId, role });
    const first = pickNext(candidates, ability?.topics || {});

       const session = await AssessmentSession.create({
      user: userId,
      role,
      maxQuestions: clamp(Number(maxQuestions) || 8, 3, 15),
      seThreshold: clamp(Number(seThreshold) || 0.6, 0.3, 1),
      useRag: useRag !== false,
      current: first._id,
    });


    const question = await BankQuestion.findById(first._id);
    return { sessionId: session._id, max: session.maxQuestions, answered: 0, question: publicQ(question) };
  }

  async answer(userId, sessionId, answerText) {
    // Atomically claim the current question so double-submits cannot score twice
    const claimed = await AssessmentSession.findOneAndUpdate(
      { _id: sessionId, user: userId, status: 'active', current: { $ne: null } },
      { $set: { current: null } },
      { new: false }
    );
    if (!claimed) throw new AppError('No active question for this session', 409);

    try {
      return await this._score(userId, claimed, answerText);
    } catch (e) {
      await AssessmentSession.updateOne({ _id: sessionId }, { $set: { current: claimed.current } });
      throw e;
    }
  }

  async _score(userId, claimed, answerText) {
    const t0 = Date.now();
    const question = await BankQuestion.findById(claimed.current);
    if (!question) throw new AppError('Question not found', 404);

    // 1. Rubric score s in [0,1]  (RAG chunks will be passed here later)
        let chunks = [];
    let retrievedIds = [];
    if (claimed.useRag !== false) {
      try {
       const found = await rag.retrieve(
  question.question,
  { topic: question.topic, k: 3 }
);
        chunks = found.map((c) => c.text);
        retrievedIds = found.map((c) => c.docId);
      } catch (e) {
        console.error('[assessment] retrieval failed, scoring without RAG:', e?.message || e);
      }
    }
    const result = await rubric.evaluate({ question, answer: answerText, referenceChunks: chunks });
    const s = result.overall;

    // 2. IRT update for this topic
    const ability =
      (await UserAbility.findOne({ user: userId, role: claimed.role })) ||
      new UserAbility({ user: userId, role: claimed.role, topics: {} });

    const before = ability.topics[question.topic] || newTopicState();
    const b = difficultyToB(question.difficulty);
    const { p, state } = updateTopic(before, b, s);

    ability.topics = { ...ability.topics, [question.topic]: state };
    ability.markModified('topics');

    // 3. Log the step
    const step = claimed.asked.length + 1;
    await AbilityTrace.create({
      user: userId,
      session: claimed._id,
      step,
      question: question._id,
      qid: question.qid,
      topic: question.topic,
      difficulty: question.difficulty,
      b,
      score: s,
      expected: r3(p),
      thetaBefore: r3(before.theta),
      thetaAfter: r3(state.theta),
      seBefore: r3(before.se),
      seAfter: r3(state.se),
      method: result.method,
          latencyMs: Date.now() - t0,
      answerText: String(answerText || '').slice(0, 4000),
      rubric: {
        correctness: result.correctness,
        depth: result.depth,
        completeness: result.completeness,
        communication: result.communication,
        missingConcepts: result.missingConcepts,
        strengths: result.strengths,
        retrieved: retrievedIds,
        ragUsed: claimed.useRag !== false,
      },
    });

    // 4. Decide: stop or choose the next question
    const asked = [...claimed.asked, question._id];
    const allQ = await BankQuestion.find({ role: claimed.role }).select('topic difficulty').lean();
    const topics = [...new Set(allQ.map((q) => q.topic))];
    const reason = stopReason({
      asked: asked.length,
      max: claimed.maxQuestions,
      topics,
      topicStates: ability.topics,
      threshold: claimed.seThreshold,
    });

    const remaining = allQ.filter((q) => !asked.some((a) => String(a) === String(q._id)));
    const next = reason || !remaining.length ? null : pickNext(remaining, ability.topics);

    const feedback = {
      score: s,
      method: result.method,
      rubric: {
        correctness: result.correctness,
        depth: result.depth,
        completeness: result.completeness,
        communication: result.communication,
      },
      missingConcepts: result.missingConcepts,
      strengths: result.strengths,
      keyPoints: question.keyPoints,
      modelAnswer: question.modelAnswer,
      topic: question.topic,
      expected: r3(p),
      thetaBefore: r3(before.theta),
      thetaAfter: r3(state.theta),
      se: r3(state.se),
    };

    if (!next) {
      const finalReason = reason || 'bank_exhausted';
      const summary = await this._finalize(claimed, ability, topics, finalReason, asked);
      await ability.save();
      await AssessmentSession.updateOne(
        { _id: claimed._id },
        { $set: { asked, current: null, status: 'completed', stopReason: finalReason, summary } }
      );
      const trace = await AbilityTrace.find({ session: claimed._id }).sort({ step: 1 }).lean();
      return { feedback, next: null, done: true, summary, trace, answered: asked.length, max: claimed.maxQuestions };
    }

    await ability.save();
    await AssessmentSession.updateOne({ _id: claimed._id }, { $set: { asked, current: next._id } });
    const nextQ = await BankQuestion.findById(next._id);
    return { feedback, next: publicQ(nextQ), done: false, answered: asked.length, max: claimed.maxQuestions };
  }

  async _finalize(session, ability, topics, reason, asked) {
    const traces = await AbilityTrace.find({ session: session._id }).lean();

    const list = topics.map((t) => {
      const st = ability.topics[t] || newTopicState();
      return {
        topic: t,
        theta: r3(st.theta),
        se: r3(st.se),
        n: st.n,
        level: st.n ? levelOf(st.theta) : 'Not assessed',
      };
    });

    // Weak = low theta, or too little evidence (high se, few answers)
    const weak = [...list]
      .sort((a, b) => (a.n < 2 ? a.theta - 1 : a.theta) - (b.n < 2 ? b.theta - 1 : b.theta))
      .slice(0, 3)
      .map((w) => {
        const counts = {};
        traces
          .filter((t) => t.topic === w.topic)
          .forEach((t) => (t.rubric?.missingConcepts || []).forEach((c) => { counts[c] = (counts[c] || 0) + 1; }));
        const missing = Object.entries(counts).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([c]) => c);
        return {
          ...w,
          why: w.n < 2
            ? 'Not enough answers yet to be confident about this topic.'
            : missing.length
            ? 'Concepts missing from your answers.'
            : 'Lower estimated ability than your other topics.',
          missingConcepts: missing,
        };
      });

    const summary = {
      role: session.role,
      stopReason: reason,
      questions: asked.length,
      topics: list,
      weakTopics: weak,
    };

    ability.snapshots = [
      ...(ability.snapshots || []).slice(-49),
      { at: new Date(), session: session._id, topics: list },
    ];
    ability.markModified('snapshots');

    return summary;
  }
    /** Study plan from theta + RAG. No LLM: every item traces back to data. */
  async plan(userId, sessionId) {
    const session = await AssessmentSession.findOne({ _id: sessionId, user: userId });
    if (!session) throw new AppError('Session not found', 404);
    if (session.status !== 'completed' || !session.summary) {
      throw new AppError('Finish the assessment first', 400);
    }

    const out = [];
    for (const w of session.summary.weakTopics || []) {
      const query = [w.topic, ...(w.missingConcepts || [])].join(' ');
      const found = await rag.retrieve(query, { topic: w.topic, k: 3 });

      const pool = await BankQuestion.find({
        role: session.role,
        topic: w.topic,
        _id: { $nin: session.asked },
      }).select('question difficulty').lean();
      const practice = pool
        .sort((a, b) => Math.abs(difficultyToB(a.difficulty) - w.theta) - Math.abs(difficultyToB(b.difficulty) - w.theta))
        .slice(0, 3);

      out.push({
        topic: w.topic,
        theta: w.theta,
        why: w.why,
        missingConcepts: w.missingConcepts || [],
        materials: found.map((c) => ({
          title: c.title,
          snippet: c.text.length > 260 ? `${c.text.slice(0, 260)}…` : c.text,
        })),
        practice,
        steps: [
          found.length ? `Read: ${found.map((c) => c.title).join('; ')}` : `Review the basics of ${w.topic}`,
          practice.length ? 'Answer the practice questions below without notes, then compare with a reference answer' : 'Retake the assessment on this topic',
          'Retake the assessment in 2-3 days and compare your ability estimate',
        ],
      });
    }
    return { role: session.role, topics: out };
  }
  
  async get(userId, sessionId) {
    const session = await AssessmentSession.findOne({ _id: sessionId, user: userId });
    if (!session) throw new AppError('Session not found', 404);
    const trace = await AbilityTrace.find({ session: sessionId }).sort({ step: 1 }).lean();
    const question = session.current ? await BankQuestion.findById(session.current) : null;
    return { session, trace, question: publicQ(question) };
  }

  async abilities(userId) {
    return UserAbility.find({ user: userId }).sort({ updatedAt: -1 });
  }
}

export default new AssessmentService();