import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { evidenceService } from '../services/api';

const DIMS = [
  ['correctness', 'Correctness', 'Are the statements accurate?'],
  ['depth', 'Depth', 'Does it explain why and how, not just what?'],
  ['completeness', 'Completeness', 'How many key points does it cover?'],
  ['communication', 'Communication', 'Is it clear and well organised?'],
];
const EMPTY = { correctness: null, depth: null, completeness: null, communication: null };
const fmt = (v) => (v === null || v === undefined ? '–' : v);

const RateAnswers = () => {
  const [item, setItem] = useState(null);
  const [progress, setProgress] = useState({ mine: 0, remaining: 0 });
  const [scores, setScores] = useState(EMPTY);
  const [includeOwn, setIncludeOwn] = useState(false);
  const [skipped, setSkipped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agreement, setAgreement] = useState(null);

  const load = useCallback(async (skip = skipped, own = includeOwn) => {
    setLoading(true);
    try {
      const res = await evidenceService.next({ includeOwn: own, skip: skip.join(',') });
      setItem(res.data.item);
      setProgress(res.data.progress);
      setScores(EMPTY);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load an answer', { id: 'rate-err' });
    } finally {
      setLoading(false);
    }
  }, [skipped, includeOwn]);

  useEffect(() => { load([], false); /* eslint-disable-next-line */ }, []);

  const complete = DIMS.every(([k]) => scores[k] !== null);

  const submit = async () => {
    setSaving(true);
    try {
      await evidenceService.rate({ traceId: item.id, ...scores });
      toast.success('Rating saved', { id: 'rate-ok' });
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save', { id: 'rate-err' });
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    const next = [...skipped, item.id];
    setSkipped(next);
    await load(next);
  };

  const loadAgreement = async () => {
    try {
      const res = await evidenceService.agreement();
      setAgreement(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not compute agreement', { id: 'agr-err' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Rate answers</h1>
        <span className="text-sm text-slate-600">
          You rated {progress.mine} · {progress.remaining} left for you
        </span>
      </div>

      <div className="card space-y-1 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">How to score (0-10), the same for every dimension</p>
        <p>0-2 empty or wrong · 3-4 weak · 5-6 partly right · 7-8 good · 9-10 excellent.</p>
        <p className="text-xs text-slate-500">
          Rate on your own and do not discuss scores with other raters. The AI score is hidden on purpose.
        </p>
        <label className="flex items-center gap-2 pt-1 text-xs">
          <input
            type="checkbox"
            checked={includeOwn}
            onChange={(e) => { setIncludeOwn(e.target.checked); load(skipped, e.target.checked); }}
          />
          Include my own answers (only for testing, it biases results)
        </label>
      </div>

      {loading && <div className="card text-center text-slate-500">Loading…</div>}

      {!loading && !item && (
        <div className="card text-center text-slate-600">
          No answers waiting for you. Ask classmates to complete an Adaptive Assessment, or tick "include my own answers" to test the page.
        </div>
      )}

      {!loading && item && (
        <div className="card space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700">{item.topic}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">Difficulty {item.difficulty}/5</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">{item.question}</p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Key points a good answer covers</p>
            <ul className="list-disc pl-5 text-sm text-slate-700">
              {item.keyPoints.map((k) => <li key={k}>{k}</li>)}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate's answer</p>
            <p className="whitespace-pre-wrap text-sm text-slate-900">{item.answer}</p>
          </div>

          {DIMS.map(([key, label, help]) => (
            <div key={key}>
              <p className="text-sm font-semibold text-slate-800">{label} <span className="font-normal text-slate-500">· {help}</span></p>
              <div className="mt-1 flex flex-wrap gap-1">
                {Array.from({ length: 11 }, (_, v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setScores((s) => ({ ...s, [key]: v }))}
                    className={`h-9 w-9 rounded-lg text-sm font-semibold ${
                      scores[key] === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button type="button" className="btn-primary" disabled={!complete || saving} onClick={submit}>
              {saving ? 'Saving…' : 'Save rating'}
            </button>
            <button type="button" className="btn-secondary" disabled={saving} onClick={skip}>Skip</button>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">AI vs human agreement</h2>
          <button type="button" className="btn-secondary !py-1.5 text-sm" onClick={loadAgreement}>Compute</button>
        </div>
        {agreement && (
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              {agreement.coverage.ratedAnswers} rated answers · {agreement.coverage.ratedByTwoPlus} rated by 2+ people ·{' '}
              {agreement.coverage.raters} raters
            </p>
            <p>
              <b>Spearman (AI vs human):</b> {fmt(agreement.overall.spearman)}{' '}
              {agreement.overall.ci95 && `(95% CI ${fmt(agreement.overall.ci95[0])} to ${fmt(agreement.overall.ci95[1])})`} ·{' '}
              <b>MAE:</b> {fmt(agreement.overall.mae)}
            </p>
            <p>
              <b>Inter-rater:</b> Spearman {fmt(agreement.interRater.meanSpearman)} · weighted kappa {fmt(agreement.interRater.meanKappa)}{' '}
              ({agreement.interRater.pairs} rater pairs)
            </p>
            <ul className="list-disc pl-5">
              {Object.entries(agreement.byDimension).map(([d, v]) => (
                <li key={d}>{d}: {fmt(v.spearman)} (n={v.n})</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateAnswers;