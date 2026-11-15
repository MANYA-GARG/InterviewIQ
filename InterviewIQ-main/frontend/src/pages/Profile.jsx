import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  LogOut,
  PlayCircle,
  FileText,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">{value || '—'}</p>
    </div>
  </div>
);

const QuickLink = ({ icon: Icon, label, to, color }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="flex items-center gap-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </button>
  );
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
        </div>

        {/* Avatar card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-extrabold text-white">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{user?.name || 'User'}</p>
            <p className="text-sm text-slate-500">{user?.email || ''}</p>
            <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Active
            </span>
          </div>
        </div>

        {/* Account info */}
        <div className="rounded-2xl border border-slate-200 bg-white px-6 shadow-sm">
          <h2 className="py-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Account Information
          </h2>
          <InfoRow icon={User}   label="Full Name" value={user?.name} />
          <InfoRow icon={Mail}   label="Email Address" value={user?.email} />
          <InfoRow icon={Shield} label="Account Role" value={user?.role || 'User'} />
          <InfoRow icon={Shield} label="Verification" value={user?.isEmailVerified ? 'Email Verified ✓' : 'Not Verified'} />
        </div>

        {/* Quick links */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Quick Actions
          </h2>
          <QuickLink icon={PlayCircle} label="Start New Interview"   to="/new-interview"      color="bg-emerald-600" />
          <QuickLink icon={FileText}   label="Upload / Analyze Resume" to="/analysis"          color="bg-sky-600" />
          <QuickLink icon={BarChart3}  label="View Progress Reports"  to="/progress"           color="bg-violet-600" />
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-500 mb-3">
            Session
          </h2>
          <p className="text-sm text-rose-700 mb-4">
            Logging out will clear your session. Your data will remain saved.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
  );
};

export default Profile;
