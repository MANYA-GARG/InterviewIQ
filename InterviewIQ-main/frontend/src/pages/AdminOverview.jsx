import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Users,
  UserCheck,
  CalendarCheck,
  Clock,
  TrendingUp,
  Award,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { adminDashboardService } from '../services/api';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

const StatCard = ({ title, value, icon: Icon, color, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">
          {value ?? '—'}
        </p>
        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
      </div>

      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const formatDate = (date) => {
  if (!date) return '';

  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const AdminOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await adminDashboardService.getOverview();
      setData(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to load admin dashboard'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = data?.cards || {};
  const charts = data?.charts || {};

  const userGrowth = (charts.userGrowth || []).map((item) => ({
    ...item,
    date: formatDate(item.date),
  }));

  const interviewActivity = (charts.interviewActivity || []).map((item) => ({
    ...item,
    date: formatDate(item.date),
  }));

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">
            Loading admin analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Administration
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Admin Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Platform analytics and InterviewIQ activity overview
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Users"
          value={cards.totalUsers ?? 0}
          icon={Users}
          color="bg-indigo-50 text-indigo-600"
          description="Registered candidate accounts"
        />

        <StatCard
          title="Active Users"
          value={cards.activeUsers ?? 0}
          icon={UserCheck}
          color="bg-emerald-50 text-emerald-600"
          description="Logged in within the last 7 days"
        />

        <StatCard
          title="Interviews Conducted"
          value={cards.totalInterviews ?? 0}
          icon={CalendarCheck}
          color="bg-cyan-50 text-cyan-600"
          description="Completed or evaluated interviews"
        />

        <StatCard
          title="Interviews Today"
          value={cards.interviewsToday ?? 0}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
          description="Completed today"
        />

        <StatCard
          title="Average Interview Score"
          value={`${cards.averageInterviewScore ?? 0}%`}
          icon={Award}
          color="bg-violet-50 text-violet-600"
          description="Across recorded evaluations"
        />

        <StatCard
          title="Most Popular Role"
          value={cards.mostPopularCategory || 'N/A'}
          icon={TrendingUp}
          color="bg-rose-50 text-rose-600"
          description="Most interviewed job role"
        />
      </div>

      {/* User Growth Chart */}
      <ChartCard
        title="User Growth"
        subtitle="New registrations over the last 14 days"
      >
        {userGrowth.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="New Users"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-slate-500">
            No user growth data available.
          </p>
        )}
      </ChartCard>

      {/* Interview Activity Chart */}
      <ChartCard
        title="Interview Activity"
        subtitle="Completed interviews over the last 14 days"
      >
        {interviewActivity.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interviewActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey="interviews"
                  name="Interviews"
                  fill="#06b6d4"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-slate-500">
            No interview activity data available.
          </p>
        )}
      </ChartCard>

      {/* Role Distribution + Interview Status */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Popular Roles */}
        <ChartCard
          title="Popular Interview Roles"
          subtitle="Completed interviews by job role"
        >
          {(charts.popularCategories || []).length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.popularCategories}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    dataKey="category"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="Interviews"
                    fill="#4f46e5"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              No role data available yet.
            </p>
          )}
        </ChartCard>

        {/* Interview Status */}
        <ChartCard
          title="Interview Status Distribution"
          subtitle="Breakdown of interviews by current status"
        >
          {(charts.interviewStatuses || []).length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.interviewStatuses}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ status, percent }) =>
                      `${status} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {charts.interviewStatuses.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              No interview status data available.
            </p>
          )}
        </ChartCard>
      </div>

      {/* Footer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Analytics are generated from the InterviewIQ database. Refresh to fetch the
        latest data.
      </div>
    </div>
  );
};

export default AdminOverview;