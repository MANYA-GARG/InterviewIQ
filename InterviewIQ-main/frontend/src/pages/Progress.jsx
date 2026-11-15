import { useState, useEffect } from 'react';
import { reportService, interviewService } from '../services/api';
import toast from 'react-hot-toast';
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  CheckCircle2,
  Calendar,
  Zap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

/* Small colour-coded score pill */
const ScoreBar = ({ label, score, max = 100, color = 'bg-slate-700' }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="font-bold text-slate-900">{score ?? '—'}{score != null ? `/${max}` : ''}</span>
    </div>
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-2.5 rounded-full transition-all duration-700 ${color}`}
        style={{ width: score != null ? `${Math.min((score / max) * 100, 100)}%` : '0%' }}
      />
    </div>
  </div>
);

/* Stat card */
const StatCard = ({ icon: Icon, label, value, sub, color = 'bg-slate-900' }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`inline-flex rounded-xl p-2.5 text-white ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-4 text-2xl font-extrabold text-slate-900">{value ?? '—'}</p>
    <p className="text-sm font-semibold text-slate-700">{label}</p>
    {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
  </div>
);

const Progress = () => {
  const [progress, setProgress] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progressRes, interviewsRes] = await Promise.allSettled([
        reportService.getProgress(),
        interviewService.getAll(),
      ]);

      if (progressRes.status === 'fulfilled') {
        setProgress(progressRes.value.data || progressRes.value);
      }
      if (interviewsRes.status === 'fulfilled') {
        const list = interviewsRes.value.data?.interviews || interviewsRes.value.interviews || [];
        setInterviews(list);
      }
    } catch {
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  /* Derive stats from the interviews list as a fallback */
  const totalInterviews = interviews.length;
  const evaluated = interviews.filter((i) => i.status === 'evaluated');
  const completed  = interviews.filter((i) => i.status === 'completed' || i.status === 'evaluated');
  const avgScore = evaluated.length > 0
    ? Math.round(
        evaluated.reduce((sum, i) => sum + (i.evaluationReport?.overallScore ?? 0), 0) / evaluated.length
      )
    : null;
  const lastInterview = interviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const lastScore = lastInterview?.evaluationReport?.overallScore ?? null;

  /* Chart: last 8 evaluated interviews */
  const chartData = [...evaluated]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-8)
    .map((i) => ({
      label: new Date(i.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      score: i.evaluationReport?.overallScore ?? 0,
      role: i.jobRole,
    }));

  const maxChart = Math.max(...chartData.map((d) => d.score), 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <BarChart3 className="h-4 w-4" />
              <span>Reports</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Progress Reports</h1>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          </div>
        ) : totalInterviews === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-semibold text-slate-600">No data yet</p>
            <p className="mt-1 text-sm text-slate-400">Complete interviews to see your progress here.</p>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={Calendar}
                label="Total Interviews"
                value={totalInterviews}
                sub="all time"
                color="bg-slate-700"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={completed.length}
                sub={`${evaluated.length} evaluated`}
                color="bg-emerald-600"
              />
              <StatCard
                icon={Award}
                label="Average Score"
                value={avgScore != null ? `${avgScore}%` : 'N/A'}
                sub="across evaluated"
                color="bg-violet-600"
              />
              <StatCard
                icon={Zap}
                label="Latest Score"
                value={lastScore != null ? `${lastScore}%` : 'N/A'}
                sub={lastInterview ? lastInterview.jobRole : '—'}
                color="bg-sky-600"
              />
            </div>

            {/* Score trend chart */}
            {chartData.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                  <h2 className="text-base font-semibold text-slate-900">Score Trend</h2>
                  <span className="ml-auto text-xs text-slate-400">Last {chartData.length} evaluated sessions</span>
                </div>

                {/* Simple CSS bar chart */}
                <div className="flex items-end gap-3 h-44">
                  {chartData.map((d, i) => {
                    const heightPct = Math.max((d.score / maxChart) * 100, 2);
                    const color =
                      d.score >= 80 ? 'bg-emerald-500' :
                      d.score >= 60 ? 'bg-blue-500' :
                      d.score >= 40 ? 'bg-amber-500' :
                                      'bg-red-400';
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-700">{d.score}</span>
                        <div
                          className={`w-full rounded-t-lg ${color} transition-all duration-500`}
                          style={{ height: `${heightPct}%` }}
                          title={`${d.role}: ${d.score}`}
                        />
                        <span className="text-[9px] text-slate-400 text-center leading-tight">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Per-interview category breakdown */}
            {evaluated.length > 0 && (() => {
              const last = evaluated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
              const cats = last?.evaluationReport?.categoryScores;
              if (!cats) return null;
              return (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <Target className="h-5 w-5 text-sky-600" />
                    <h2 className="text-base font-semibold text-slate-900">Latest Category Breakdown</h2>
                    <span className="ml-auto text-xs text-slate-400">{last.jobRole}</span>
                  </div>
                  <div className="space-y-4">
                    <ScoreBar label="Technical"       score={cats.technical}       color="bg-blue-500" />
                    <ScoreBar label="Communication"   score={cats.communication}   color="bg-emerald-500" />
                    <ScoreBar label="Problem Solving" score={cats.problemSolving}  color="bg-violet-500" />
                    <ScoreBar label="Confidence"      score={cats.confidence}      color="bg-amber-500" />
                  </div>
                </div>
              );
            })()}

            {/* Role distribution */}
            {totalInterviews > 0 && (() => {
              const roleCounts = interviews.reduce((acc, i) => {
                const role = i.jobRole || 'Other';
                acc[role] = (acc[role] || 0) + 1;
                return acc;
              }, {});
              const colors = ['bg-slate-700', 'bg-violet-600', 'bg-sky-600', 'bg-emerald-600', 'bg-amber-600'];
              return (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart3 className="h-5 w-5 text-slate-600" />
                    <h2 className="text-base font-semibold text-slate-900">Interviews by Role</h2>
                  </div>
                  <ul className="space-y-3">
                    {Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([role, count], i) => (
                      <li key={role} className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${colors[i % colors.length]}`} />
                        <span className="flex-1 text-sm font-medium text-slate-700 truncate">{role}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-slate-100 w-24 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${colors[i % colors.length]}`}
                              style={{ width: `${(count / totalInterviews) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 w-6 text-right">{count}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </>
        )}
      </div>
  );
};

export default Progress;
