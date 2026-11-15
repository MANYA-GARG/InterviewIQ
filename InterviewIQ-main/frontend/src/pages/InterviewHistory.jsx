import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../services/api';
import toast from 'react-hot-toast';
import {
  History,
  Calendar,
  Briefcase,
  Hash,
  Star,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
} from 'lucide-react';

const statusConfig = {
  pending:     { label: 'Pending',     color: 'bg-slate-100 text-slate-700',  icon: Clock },
  'in-progress':{ label: 'In Progress', color: 'bg-blue-100 text-blue-700',    icon: PlayCircle },
  completed:   { label: 'Completed',   color: 'bg-amber-100 text-amber-700',  icon: CheckCircle2 },
  evaluated:   { label: 'Evaluated',   color: 'bg-emerald-100 text-emerald-700', icon: Star },
};

const ScoreBadge = ({ score }) => {
  if (score == null) return <span className="text-slate-400 text-sm">—</span>;
  const color =
    score >= 80 ? 'bg-emerald-100 text-emerald-700' :
    score >= 60 ? 'bg-blue-100 text-blue-700' :
    score >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${color}`}>
      <Star className="h-3 w-3" /> {score}
    </span>
  );
};

const InterviewHistory = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const response = await interviewService.getAll();
      const list = response.data?.interviews || response.interviews || [];
      setInterviews(list);
    } catch {
      toast.error('Failed to load interview history');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? interviews
    : interviews.filter((i) => i.status === filter);

  const tabs = [
    { value: 'all',         label: 'All' },
    { value: 'evaluated',   label: 'Evaluated' },
    { value: 'completed',   label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'pending',     label: 'Pending' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <History className="h-4 w-4" />
              <span>Interview History</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">All Interviews</h1>
          </div>
          <button
            type="button"
            onClick={fetchInterviews}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilter(t.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                filter === t.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
              {t.value === 'all' && ` (${interviews.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-semibold text-slate-600">No interviews found</p>
            <p className="mt-1 text-sm text-slate-400">
              {filter === 'all'
                ? "You haven't taken any interviews yet."
                : `No interviews with status "${filter}".`}
            </p>
            {filter === 'all' && (
              <button
                type="button"
                onClick={() => navigate('/new-interview')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                <PlayCircle className="h-4 w-4" />
                Start Your First Interview
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid md:grid-cols-[140px_1fr_100px_80px_120px] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date</span>
              <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> Role</span>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Score</span>
              <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" /> Q's</span>
              <span>Action</span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-slate-100">
              {filtered.map((interview) => {
                const cfg = statusConfig[interview.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                const date = new Date(interview.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                });
                const score = interview.evaluationReport?.overallScore ?? null;
                return (
                  <li
                    key={interview._id}
                    className="grid grid-cols-1 md:grid-cols-[140px_1fr_100px_80px_120px] gap-4 items-center px-6 py-4 hover:bg-slate-50 transition"
                  >
                    {/* Date */}
                    <span className="text-sm text-slate-600">{date}</span>
                    {/* Role */}
                    <div>
                      <p className="font-semibold text-slate-900 truncate">{interview.jobRole || 'General'}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{interview.experienceLevel}</span>
                      </div>
                    </div>
                    {/* Score */}
                    <ScoreBadge score={score} />
                    {/* Questions */}
                    <span className="text-sm font-medium text-slate-700">{interview.numberOfQuestions}</span>
                    {/* Action */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/interview/${interview._id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {interview.status === 'evaluated' ? 'Report' : 'View'}
                      </button>
                      {interview.status === 'evaluated' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/evaluation/${interview._id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
                        >
                          <Star className="h-3.5 w-3.5" />
                          Eval
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
  );
};

export default InterviewHistory;
