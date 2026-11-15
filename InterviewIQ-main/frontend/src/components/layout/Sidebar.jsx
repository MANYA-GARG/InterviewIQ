import { memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Sparkles,
  Upload,
  User,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Start Interview', to: '/new-interview', icon: Bot },
  { label: 'Upload Resume', to: '/upload', icon: Upload },
  { label: 'Analysis', to: '/analysis', icon: FileText },
  { label: 'Resume Builder', to: '/resume-builder', icon: Sparkles },
    { label: 'Study Plan', to: '/study-plan', icon: CalendarCheck },
  { label: 'Preparation Hub', to: '/learn', icon: GraduationCap },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'Profile', to: '/profile', icon: User },
];

const routeMatchers = {
  '/dashboard': (path) => path === '/dashboard',
  '/new-interview': (path) =>
    path === '/new-interview' || path.startsWith('/interview/') || path.startsWith('/evaluation/'),
  '/upload': (path) => path === '/upload' || path === '/resumes',
  '/analysis': (path) => path === '/analysis',
  '/resume-builder': (path) => path === '/resume-builder',
  '/learn': (path) => path === '/learn' || path === '/dsa',
  '/reports': (path) => path === '/reports' || path === '/progress',
  '/profile': (path) => path === '/profile',
    '/study-plan': (path) => path === '/study-plan',
};

const Sidebar = ({ sidebarOpen, onClose }) => {
  const { user, logout } = useAuth();
  const sessionUser = useAppStore((state) => state.session.user);
  const clearAllSessionData = useAppStore((state) => state.clearAllSessionData);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      try {
        clearAllSessionData();
      } catch (e) {
        console.warn('Failed to clear app store during logout', e);
      }

      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      try {
        sessionStorage.clear();
      } catch (e) {}

      navigate('/login', { replace: true });
    }
  };

  const itemClass = (to) => {
    const isActive = routeMatchers[to]?.(pathname) || false;
    return `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white transition-transform duration-300 pt-16 lg:translate-x-0 print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-12 items-center gap-3 border-b border-slate-100 px-5">
          <div className="rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-600 p-2 text-white">
            <PanelLeft className="h-4 w-4" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Main Navigation</p>
        </div>

        <nav className="space-y-1.5 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={item.to} className={itemClass(item.to)} onClick={onClose}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-4">
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="truncate text-xs text-slate-500">Signed in as</p>
            <p className="truncate text-sm font-semibold text-slate-800">
              {sessionUser?.email || user?.email || 'User'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default memo(Sidebar);