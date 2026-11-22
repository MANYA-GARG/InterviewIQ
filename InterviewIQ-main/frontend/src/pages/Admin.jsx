import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download, Search, ShieldCheck } from 'lucide-react';
import { adminService } from '../services/api';

const BADGE = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-900">{value ?? '–'}</p>
  </div>
);

const Admin = () => {
  const [overview, setOverview] = useState(null);
  const [list, setList] = useState({ users: [], total: 0, page: 1, pages: 1 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const res = await adminService.overview();
      setOverview(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load overview', { id: 'adm-ov' });
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.users({ q, status, page, limit: 10 });
      setList(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load candidates', { id: 'adm-us' });
    } finally {
      setLoading(false);
    }
  }, [q, status, page]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 250);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const open = async (id) => {
    try {
      const res = await adminService.user(id);
      setDetail(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load candidate', { id: 'adm-d' });
    }
  };

  const act = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg, { id: 'adm-ok' });
      await Promise.all([loadUsers(), loadOverview()]);
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed', { id: 'adm-err' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggleSuspend = async () => {
    const u = detail.user;
    const next = u.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    if (!window.confirm(`${next === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} ${u.email}?`)) return;
    if (await act(() => adminService.setStatus(u._id, next), `Account ${next.toLowerCase()}`)) open(u._id);
  };

  const makeAdmin = async () => {
    const u = detail.user;
    if (!window.confirm(`Make ${u.email} an administrator? They will see every candidate's data.`)) return;
    if (await act(() => adminService.setRole(u._id, 'admin'), 'Promoted to admin')) setDetail(null);
  };

  const removeUser = async () => {
    const u = detail.user;
    const typed = window.prompt(`This permanently deletes ${u.email} and all their data. Type their email to confirm:`);
    if (typed !== u.email) return;
    if (await act(() => adminService.remove(u._id), 'User deleted')) setDetail(null);
  };

  const exportCsv = async () => {
    try {
      const blob = await adminService.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'candidates.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed', { id: 'adm-exp' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="h-4 w-4" /> Administration</div>
          <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
        </div>
        <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {overview && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Candidates" value={overview.candidates} />
            <Stat label="New this week" value={overview.newCandidates} />
            <Stat label="Suspended" value={overview.suspended} />
            <Stat label="Average score" value={overview.avgScore} />
            <Stat label="Interviews" value={overview.interviews} />
            <Stat label="Resumes" value={overview.resumes} />
            <Stat label="Assessments" value={overview.assessments} />
            <Stat label="Human ratings" value={overview.humanRatings} />
          </div>
          <div className="card">
            <p className="mb-2 text-sm font-semibold text-slate-800">Signups, last 14 days</p>
            {overview.signupsByDay.length ? (
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.signupsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-slate-500">No signups in this period.</p>}
          </div>
        </>
      )}

      <div className="card space-y-3">
        <div className="flex flex-wrap gap-3">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="input-field pl-9" placeholder="Search name or email" aria-label="Search candidates"
              value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </label>
          <select className="input-field !w-auto" aria-label="Filter by status" value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">Candidate</th><th className="pr-3">Status</th><th className="pr-3">Interviews</th>
                <th className="pr-3">Avg score</th><th className="pr-3">Resumes</th><th className="pr-3">Joined</th><th />
              </tr>
            </thead>
            <tbody>
              {list.users.map((u) => (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="py-2 pr-3"><p className="font-medium text-slate-900">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                  <td className="pr-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[u.accountStatus] || ''}`}>{u.accountStatus}</span></td>
                  <td className="pr-3">{u.stats.interviews}</td>
                  <td className="pr-3">{u.stats.avgScore ?? '–'}</td>
                  <td className="pr-3">{u.stats.resumes}</td>
                  <td className="pr-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td><button type="button" className="text-indigo-600 hover:underline" onClick={() => open(u._id)}>View</button></td>
                </tr>
              ))}
              {!loading && !list.users.length && (
                <tr><td colSpan="7" className="py-6 text-center text-slate-500">No candidates found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{list.total} candidates</span>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary !py-1" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>{list.page} / {list.pages}</span>
            <button type="button" className="btn-secondary !py-1" disabled={page >= list.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {detail && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{detail.user.name}</h2>
              <p className="text-sm text-slate-600">{detail.user.email}</p>
              <p className="text-xs text-slate-500">
                Joined {new Date(detail.user.createdAt).toLocaleDateString()}
                {detail.user.lastLoginAt && ` · last login ${new Date(detail.user.lastLoginAt).toLocaleString()}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" disabled={busy} onClick={toggleSuspend}>
                {detail.user.accountStatus === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
              </button>
              <button type="button" className="btn-secondary" disabled={busy} onClick={makeAdmin}>Make admin</button>
              <button type="button" className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50" disabled={busy} onClick={removeUser}>Delete</button>
              <button type="button" className="text-sm text-slate-500" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-800">Interviews ({detail.interviews.length})</p>
              <ul className="space-y-1 text-sm">
                {detail.interviews.map((i) => (
                  <li key={i._id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                    <span>{i.jobRole} · {i.status}</span>
                    <span className="font-semibold">{i.evaluationReport?.overallScore ?? '–'}</span>
                  </li>
                ))}
                {!detail.interviews.length && <li className="text-slate-500">None</li>}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-800">Resumes ({detail.resumes.length})</p>
              <ul className="space-y-1 text-sm">
                {detail.resumes.map((r) => (
                  <li key={r._id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                    <span className="truncate">{r.filename}</span><span className="font-semibold">{r.skillScore}</span>
                  </li>
                ))}
                {!detail.resumes.length && <li className="text-slate-500">None</li>}
              </ul>
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-slate-800">Assessment ability ({detail.assessments} sessions)</p>
            {detail.abilities.length ? detail.abilities.map((a) => (
              <div key={a._id} className="mb-2">
                <p className="text-xs font-semibold text-slate-600">{a.role}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(a.topics || {}).map(([t, s]) => (
                    <span key={t} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700">
                      {t}: {Number(s.theta).toFixed(2)} (se {Number(s.se).toFixed(2)})
                    </span>
                  ))}
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No assessments yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;