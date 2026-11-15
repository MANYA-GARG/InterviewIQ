import { useState } from 'react';
import { resumeService } from '../../services/api';
import toast from 'react-hot-toast';
import Card from './Card';
import { Button } from './Button';

const ROLES = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Data Scientist', 'Java Developer', 'DevOps Engineer',
];

const Chips = ({ items = [], className }) =>
  items.length ? (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <span key={s} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{s}</span>
      ))}
    </div>
  ) : (
    <p className="text-sm text-slate-500">None</p>
  );

const ResumeMatchCard = ({ resumeId }) => {
  const [targetRole, setTargetRole] = useState(ROLES[0]);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!resumeId) {
      toast.error('Upload a resume first');
      return;
    }
    setLoading(true);
    try {
      const res = await resumeService.match(resumeId, { targetRole, jobDescription });
      setResult(res.data?.match || null);
    } catch (e) {
      console.error('match error', e);
      toast.error(e.response?.data?.message || e.message || 'Match failed', { id: 'match-error' });
    } finally {
      setLoading(false);
    }
  };

  const score = result?.matchScore ?? 0;

  return (
    <Card title="ATS Match" subtitle="Compare your resume against a target role or a pasted job description.">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="targetRole" className="mb-1 block text-sm font-medium text-slate-700">
              Target role
            </label>
            <select
              id="targetRole"
              name="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="input-field"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-500">Ignored if a job description is pasted.</p>
          </div>
          <div>
            <label htmlFor="jobDescription" className="mb-1 block text-sm font-medium text-slate-700">
              Job description (optional)
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder="Paste a job posting here for an exact match..."
            />
          </div>
        </div>

        <Button type="button" onClick={run} loading={loading}>Analyze Match</Button>

        {result && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-extrabold ${score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                {score}%
              </div>
              <div>
                <p className="font-semibold text-slate-900">Match for {result.targetRole}</p>
                <p className="text-xs text-slate-500">
                  Based on {result.source === 'job-description' ? 'the pasted job description' : 'a standard role profile'}
                </p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Matched required skills</p>
              <Chips items={result.matchedRequired} className="border-emerald-200 bg-emerald-50 text-emerald-700" />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Missing required skills</p>
              <Chips items={result.missingRequired} className="border-red-200 bg-red-50 text-red-700" />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Missing preferred skills</p>
              <Chips items={result.missingPreferred} className="border-amber-200 bg-amber-50 text-amber-700" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResumeMatchCard;