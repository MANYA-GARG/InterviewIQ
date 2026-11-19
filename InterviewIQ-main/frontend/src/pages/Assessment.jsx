
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { assessmentService } from '../services/api';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6'];

const Bar = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-xs text-slate-600">
      <span>{label}</span>
      <span className="font-semibold">{value}/10</span>
    </div>
    <div className="h-2 rounded-full bg-slate-200">
      <div
        className="h-2 rounded-full bg-indigo-600"
        style={{ width: `${(value / 10) * 100}%` }}
      />
    </div>
  </div>
);

const Assessment = () => {
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState('');
  const [maxQ, setMaxQ] = useState(8);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState({ answered: 0, max: 0 });
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(null);
  const [nextQ, setNextQ] = useState(null);
  const [useRag, setUseRag] = useState(true);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    assessmentService.roles()
      .then((res) => {
        const list = res.data?.roles || [];
        setRoles(list);
        if (list[0]) setRole(list[0].role);
      })
      .catch(() => toast.error('Could not load roles', { id: 'roles-err' }));
  }, []);

  const start = async () => {
    setBusy(true);

    try {
      const res = await assessmentService.start({
        role,
        maxQuestions: maxQ,
        useRag,
      });

      setSessionId(res.data.sessionId);
      setQuestion(res.data.question);
      setProgress({ answered: 0, max: res.data.max });
      setFeedback(null);
      setDone(null);
      setPlan(null);
      setAnswer('');
      setNextQ(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not start', {
        id: 'start-err',
      });
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!answer.trim()) return toast.error('Write an answer first');

    setBusy(true);

    try {
      const res = await assessmentService.answer(sessionId, answer);
      const d = res.data;

      setFeedback(d.feedback);
      setProgress({ answered: d.answered, max: d.max });
      setNextQ(d.next);

      if (d.done) {
        setDone({ summary: d.summary, trace: d.trace });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Scoring failed', {
        id: 'score-err',
      });
    } finally {
      setBusy(false);
    }
  };

  // Generate personalized study plan
  const loadPlan = async () => {
    setBusy(true);

    try {
      const res = await assessmentService.plan(sessionId);
      setPlan(res.data);
    } catch (e) {
      toast.error(
        e.response?.data?.message || 'Could not build the plan',
        { id: 'plan-err' }
      );
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    setQuestion(nextQ);
    setNextQ(null);
    setFeedback(null);
    setAnswer('');
  };

  // Chart data: one point per step, one line per topic
  const traceData =
    done?.trace?.map((t) => ({
      step: t.step,
      [t.topic]: t.thetaAfter,
    })) || [];

  const chartTopics = [
    ...new Set(done?.trace?.map((t) => t.topic) || []),
  ];

  // Assessment start screen
  if (!sessionId) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Adaptive Assessment
        </h1>

        <p className="text-slate-600">
          Questions adapt to your estimated skill in each topic. Each answer
          is scored against a rubric and updates your ability estimate.
        </p>

        <div className="card space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Role
            </span>

            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.role} ({r.questions} questions)
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Maximum questions (3-15)
            </span>

            <input
              type="number"
              min="3"
              max="15"
              className="input-field"
              value={maxQ}
              onChange={(e) => setMaxQ(Number(e.target.value))}
            />
          </label>

          {/* RAG Option */}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
            />
            Ground scoring in reference notes (RAG)
          </label>

          <button
            type="button"
            className="btn-primary"
            onClick={start}
            disabled={busy || !role}
          >
            {busy ? 'Starting…' : 'Start assessment'}
          </button>
        </div>
      </div>
    );
  }

  // Assessment screen
  return (
    <div className="mx-auto max-w-3xl space-y-4">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Adaptive Assessment
        </h1>

        <span className="text-sm font-medium text-slate-600">
          {progress.answered}/{progress.max} answered
        </span>
      </div>

      {/* Question Section */}
      {!done && question && (
        <div className="card space-y-3">

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700">
              {question.topic}
            </span>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              Difficulty {question.difficulty}/5
            </span>
          </div>

          <p className="text-lg font-semibold text-slate-900">
            {question.question}
          </p>

          <textarea
            className="input-field min-h-[160px] text-sm"
            value={answer}
            maxLength={4000}
            disabled={busy || !!feedback}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer…"
            aria-label="Your answer"
          />

          {!feedback && (
            <button
              type="button"
              className="btn-primary"
              onClick={submit}
              disabled={busy}
            >
              {busy ? 'Scoring…' : 'Submit answer'}
            </button>
          )}
        </div>
      )}

      {/* Answer Feedback */}
      {feedback && (
        <div className="card space-y-4">

          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900">
              Score: {Math.round(feedback.score * 100)}%
            </p>

            <p className="text-xs text-slate-500">
              {feedback.topic} ability {feedback.thetaBefore} →{' '}
              <b>{feedback.thetaAfter}</b> (uncertainty {feedback.se};
              expected {feedback.expected})
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(feedback.rubric).map(([k, v]) => (
              <Bar key={k} label={k} value={v} />
            ))}
          </div>

          {feedback.method !== 'llm' && (
            <p className="text-xs text-amber-700">
              {feedback.method === 'rejected'
                ? 'The answer was too short or not meaningful, so it scored 0.'
                : 'AI scoring was unavailable, so keyword matching was used.'}
            </p>
          )}

          {feedback.missingConcepts.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-rose-700">
                Missing
              </p>

              <ul className="list-disc pl-5 text-sm text-slate-700">
                {feedback.missingConcepts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.strengths.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Strengths
              </p>

              <ul className="list-disc pl-5 text-sm text-slate-700">
                {feedback.strengths.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          <details className="text-sm text-slate-700">
            <summary className="cursor-pointer font-medium text-indigo-600">
              Reference answer
            </summary>

            <p className="mt-2">{feedback.modelAnswer}</p>
          </details>

          {!done && (
            <button
              type="button"
              className="btn-primary"
              onClick={goNext}
            >
              Next question
            </button>
          )}
        </div>
      )}

      {/* Assessment Results */}
      {done && (
        <div className="card space-y-5">

          <h2 className="text-lg font-bold text-slate-900">
            Results for {done.summary.role}
          </h2>

          <p className="text-xs text-slate-500">
            Stopped because:{' '}
            {done.summary.stopReason === 'confident'
              ? 'estimates are confident'
              : done.summary.stopReason === 'max_questions'
              ? 'question limit reached'
              : 'no more questions'}
          </p>

          {/* Topic Scores */}
          <div className="grid gap-3 sm:grid-cols-3">
            {done.summary.topics.map((t) => (
              <div
                key={t.topic}
                className="rounded-xl border border-slate-200 p-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {t.topic}
                </p>

                <p className="text-xl font-bold text-indigo-600">
                  {t.theta}
                </p>

                <p className="text-xs text-slate-500">
                  {t.level} · se {t.se} · {t.n} answered
                </p>
              </div>
            ))}
          </div>

          {/* Ability Chart */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">
              Ability estimate over the session
            </p>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={traceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis dataKey="step" tick={{ fontSize: 11 }} />

                  <YAxis
                    domain={[-3, 3]}
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip />
                  <Legend />

                  {chartTopics.map((t, i) => (
                    <Line
                      key={t}
                      type="monotone"
                      dataKey={t}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      connectNulls
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weak Topics */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">
              Top weak topics
            </p>

            <ul className="space-y-2">
              {done.summary.weakTopics.map((w) => (
                <li
                  key={w.topic}
                  className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-sm"
                >
                  <p className="font-semibold text-slate-900">
                    {w.topic}{' '}
                    <span className="font-normal text-slate-500">
                      (ability {w.theta})
                    </span>
                  </p>

                  <p className="text-slate-600">{w.why}</p>

                  {w.missingConcepts.length > 0 && (
                    <p className="mt-1 text-xs text-rose-700">
                      Missing: {w.missingConcepts.join('; ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Personalized Study Plan */}
          {!plan ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={loadPlan}
              disabled={busy}
            >
              {busy ? 'Building…' : 'Build my study plan'}
            </button>
          ) : (
            <div className="space-y-4">

              <p className="text-sm font-semibold text-slate-800">
                Study plan
              </p>

              {plan.topics.map((t) => (
                <div
                  key={t.topic}
                  className="rounded-xl border border-slate-200 p-4 text-sm"
                >
                  <p className="font-semibold text-slate-900">
                    {t.topic}{' '}
                    <span className="font-normal text-slate-500">
                      (ability {t.theta})
                    </span>
                  </p>

                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
                    {t.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>

                  {t.materials.map((m) => (
                    <details key={m.title} className="mt-2">
                      <summary className="cursor-pointer font-medium text-indigo-600">
                        {m.title}
                      </summary>

                      <p className="mt-1 text-slate-600">
                        {m.snippet}
                      </p>
                    </details>
                  ))}

                  {t.practice.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-slate-700">
                      {t.practice.map((p) => (
                        <li key={p._id}>
                          {p.question}{' '}
                          <span className="text-xs text-slate-400">
                            (d{p.difficulty})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New Assessment */}
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setSessionId(null);
              setQuestion(null);
              setDone(null);
              setFeedback(null);
              setPlan(null);
              setAnswer('');
              setNextQ(null);
              setProgress({ answered: 0, max: 0 });
            }}
          >
            New assessment
          </button>

        </div>
      )}
    </div>
  );
};

export default Assessment;
