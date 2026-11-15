import { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { atsService } from '../../services/api';
import Card from './Card';
import { Button } from './Button';

const STATUS = {
  pass: { Icon: CheckCircle2, cls: 'text-emerald-600', row: 'border-emerald-100 bg-emerald-50/40' },
  warn: { Icon: AlertTriangle, cls: 'text-amber-600', row: 'border-amber-100 bg-amber-50/40' },
  fail: { Icon: XCircle, cls: 'text-red-600', row: 'border-red-100 bg-red-50/40' },
};

const AtsCheckerCard = ({ resumeId }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!resumeId) {
      toast.error('Upload a resume first');
      return;
    }
    setLoading(true);
    try {
      const res = await atsService.check(resumeId);
      setResult(res.data?.ats || null);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'ATS check failed', { id: 'ats-err' });
    } finally {
      setLoading(false);
    }
  };

  const score = result?.score ?? 0;
  const color = score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <Card title="ATS Checker" subtitle="Rule-based checks that mimic how applicant tracking systems read a resume.">
      <div className="space-y-4">
        <Button type="button" onClick={run} loading={loading}>Run ATS check</Button>

        {result && (
          <div className="space-y-5 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-extrabold ${color}`}>{score}</div>
              <div>
                <p className="font-semibold text-slate-900">out of 100 · {result.grade}</p>
                <p className="text-xs text-slate-500">
                  {result.stats.wordCount} words · {result.stats.quantifiedLines} quantified lines · {result.stats.actionVerbLines} action-verb bullets
                </p>
              </div>
            </div>

            {result.topFixes.length > 0 && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="mb-2 text-sm font-semibold text-indigo-900">Fix these first</p>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-indigo-900">
                  {result.topFixes.map((f) => (
                    <li key={f.label}>
                      <span className="font-medium">{f.label}</span>: {f.fix}{' '}
                      <span className="text-indigo-500">(+{f.pointsLost} pts)</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <ul className="space-y-2">
              {result.checks.map((c) => {
                const { Icon, cls, row } = STATUS[c.status];
                return (
                  <li key={c.id} className={`flex items-start gap-3 rounded-lg border p-3 ${row}`}>
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cls}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                        <p className="shrink-0 text-xs font-semibold text-slate-500">{c.points}/{c.max}</p>
                      </div>
                      <p className="text-xs text-slate-600">{c.detail}</p>
                      {c.fix && <p className="mt-1 text-xs font-medium text-slate-800">Fix: {c.fix}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AtsCheckerCard;