import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarCheck, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { coachService } from '../services/api';

const TYPE_STYLE = {
  learn: 'bg-sky-100 text-sky-700',
  practice: 'bg-emerald-100 text-emerald-700',
  review: 'bg-amber-100 text-amber-700',
  mock: 'bg-violet-100 text-violet-700',
};

const StudyPlan = () => {
  const [searchParams] = useSearchParams();
  const interviewParam = searchParams.get('interview');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const autoRan = useRef(false);

  const generate = useCallback(async (interviewId) => {
    setGenerating(true);
    try {
      const res = await coachService.generate(interviewId ? { interviewId } : {});
      setPlan(res.data?.plan || null);
      toast.success('Study plan ready', { id: 'plan-ok' });
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Could not create the plan', { id: 'plan-err' });
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    (async () => {
      let latest = null;
      try {
        const res = await coachService.latest();
        latest = res.data?.plan || null;
        setPlan(latest);
      } catch {
        // no plan yet
      }
      setLoading(false);
      if (interviewParam && (!latest || String(latest.interview) !== interviewParam)) {
        generate(interviewParam);
      }
    })();
  }, [interviewParam, generate]);

  const toggle = async (dayIndex, taskIndex) => {
    const done = !plan.days[dayIndex].tasks[taskIndex].done;
    const previous = plan;
    setPlan((p) => {
      const copy = structuredClone(p);
      copy.days[dayIndex].tasks[taskIndex].done = done;
      return copy;
    });
    try {
      await coachService.toggleTask(plan._id, { dayIndex, taskIndex, done });
    } catch {
      setPlan(previous);
      toast.error('Could not update the task', { id: 'task-err' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
      </div>
    );
  }

  const allTasks = plan ? plan.days.flatMap((d) => d.tasks) : [];
  const doneCount = allTasks.filter((t) => t.done).length;
  const pct = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <CalendarCheck className="h-4 w-4" /> Coach
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Your 7-day study plan</h1>
        </div>
        <button
          type="button"
          onClick={() => generate(plan?.interview || undefined)}
          disabled={generating}
          className="btn-primary inline-flex items-center gap-2"
        >
          {plan ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {generating ? 'Building your plan…' : plan ? 'Regenerate' : 'Generate my plan'}
        </button>
      </div>

      {!plan && !generating && (
        <div className="card text-center text-slate-600">
          No plan yet. Finish an interview or upload a resume, then generate a plan built from your real results.
        </div>
      )}

      {plan && (
        <>
          <div className="card space-y-4">
            {plan.summary && <p className="text-slate-700">{plan.summary}</p>}
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-700">Progress</span>
                <span className="font-semibold text-indigo-600">{doneCount}/{allTasks.length} tasks · {pct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-2.5 rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {plan.weakAreas?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {plan.weakAreas.map((w) => (
                  <span key={w.area} title={w.reason} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                    {w.area}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">
              {plan.source === 'ai' ? 'Written by AI from your results.' : 'Built from your scores with rules (AI was unavailable).'}
            </p>
          </div>

          <div className="space-y-4">
            {plan.days.map((day, di) => (
              <section key={day.day} className="card">
                <h2 className="mb-3 text-base font-semibold text-slate-900">
                  Day {day.day}: {day.focus}
                </h2>
                <ul className="space-y-2">
                  {day.tasks.map((task, ti) => (
                    <li key={ti} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggle(di, ti)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
                        aria-label={`Mark done: ${task.title}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${task.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${TYPE_STYLE[task.type]}`}>{task.type}</span>
                          <span className="text-slate-500">{task.minutes} min</span>
                          {task.query && (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(task.query)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              Find resources <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudyPlan;