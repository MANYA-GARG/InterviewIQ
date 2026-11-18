const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// difficulty 1..5  ->  b in [-1, 1]
export const difficultyToB = (d) => (clamp(Number(d) || 3, 1, 5) - 3) / 2;

export const expectedScore = (theta, b) => 1 / (1 + Math.exp(-(theta - b)));

// Learning rate shrinks as evidence grows
export const stepSize = (n) => 0.6 / Math.sqrt(n + 1);

// info starts at 1 (prior), so se starts at 1.0
export const newTopicState = () => ({ theta: 0, info: 1, se: 1, n: 0 });

export function updateTopic(state, b, s) {
  const p = expectedScore(state.theta, b);
  const theta = clamp(state.theta + stepSize(state.n) * (s - p), -3, 3);
  const info = state.info + p * (1 - p);
  return {
    p,
    state: { theta, info, se: 1 / Math.sqrt(info), n: state.n + 1 },
  };
}

/**
 * candidates: [{ _id, topic, difficulty }]  (unasked questions)
 * topicStates: { [topic]: {theta, se, ...} }
 * Topic with the highest uncertainty (ties: lowest theta), then the question
 * whose difficulty is closest to theta.
 */
export function pickNext(candidates, topicStates = {}) {
  if (!candidates.length) return null;
  const stateOf = (t) => topicStates[t] || newTopicState();

  const byTopic = new Map();
  for (const c of candidates) {
    if (!byTopic.has(c.topic)) byTopic.set(c.topic, []);
    byTopic.get(c.topic).push(c);
  }

  const ranked = [...byTopic.keys()]
    .map((t) => ({ t, se: stateOf(t).se, theta: stateOf(t).theta, j: Math.random() }))
    .sort((a, b) => b.se - a.se || a.theta - b.theta || a.j - b.j);

  const topic = ranked[0].t;
  const theta = stateOf(topic).theta;

  return byTopic
    .get(topic)
    .map((c) => ({ c, gap: Math.abs(difficultyToB(c.difficulty) - theta), j: Math.random() }))
    .sort((x, y) => x.gap - y.gap || x.j - y.j)[0].c;
}

export function stopReason({ asked, max, topics, topicStates, threshold }) {
  if (asked >= max) return 'max_questions';
  if (
    topics.length &&
    topics.every((t) => (topicStates[t] || newTopicState()).se <= threshold)
  ) {
    return 'confident';
  }
  return null;
}

export const levelOf = (theta) =>
  theta < -0.5 ? 'Beginner' : theta < 0.5 ? 'Intermediate' : 'Advanced';