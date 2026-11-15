import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  Brain,
  FileText,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Trophy,
  TrendingUp,
  Zap,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import DashboardCard from '../components/common/DashboardCard';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import { SkeletonCard } from '../components/common/Skeleton';
import { dashboardService, interviewService, reportService } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  const [summary, setSummary] = useState({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    totalResumes: 0,
    averageAtsScore: 0,
  });

  const [performanceData, setPerformanceData] = useState([]);
  const [categoryScores, setCategoryScores] = useState({
    technical: 0,
    communication: 0,
    problemSolving: 0,
    confidence: 0,
  });
  const [skillDistribution, setSkillDistribution] = useState({
    frontend: 0,
    backend: 0,
    tools: 0,
  });
  const [insights, setInsights] = useState({
    roleReadiness: 0,
    weakAreas: [],
    suggestions: [],
  });

  const [latestRole, setLatestRole] = useState('');
  const hasFetchedDashboardRef = useRef(false);


  useEffect(() => {
    if (hasFetchedDashboardRef.current) {
      return;
    }
    hasFetchedDashboardRef.current = true;

    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      setDashboardError('');

      try {
        const [summaryRes, performanceRes, categoriesRes, skillsRes, insightsRes, interviewsRes] =
          await Promise.allSettled([
            dashboardService.getSummary(),
            reportService.getPerformance(),
            reportService.getCategoryScores(),
            reportService.getSkills(),
            reportService.getInsights(),
            interviewService.getAll({ limit: 1 }),
          ]);

        if (summaryRes.status === 'fulfilled') {
          const data = summaryRes.value?.data || {};
          setSummary({
            totalInterviews: data.totalInterviews || 0,
            averageScore: data.averageScore || 0,
            bestScore: data.bestScore || 0,
            totalResumes: data.totalResumes || 0,
            averageAtsScore: data.averageAtsScore || 0,
          });
        }

        if (performanceRes.status === 'fulfilled') {
          setPerformanceData(Array.isArray(performanceRes.value?.data) ? performanceRes.value.data : []);
        }

        if (categoriesRes.status === 'fulfilled') {
          const data = categoriesRes.value?.data || {};
          setCategoryScores({
            technical: data.technical || 0,
            communication: data.communication || 0,
            problemSolving: data.problemSolving || 0,
            confidence: data.confidence || 0,
          });
        }

        if (skillsRes.status === 'fulfilled') {
          const data = skillsRes.value?.data || {};
          setSkillDistribution({
            frontend: data.frontend || 0,
            backend: data.backend || 0,
            tools: data.tools || 0,
          });
        }

        if (insightsRes.status === 'fulfilled') {
          const data = insightsRes.value?.data || {};
          setInsights({
            roleReadiness: data.roleReadiness || 0,
            weakAreas: Array.isArray(data.weakAreas) ? data.weakAreas : [],
            suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
          });
        }

        if (interviewsRes.status === 'fulfilled') {
          const interviews = interviewsRes.value?.data?.interviews || [];
          if (interviews[0]?.jobRole) {
            setLatestRole(interviews[0].jobRole);
          }
        }

        const hasFailure = [summaryRes, performanceRes, categoriesRes, skillsRes, insightsRes].some(
          (item) => item.status === 'rejected'
        );

        if (hasFailure) {
          setDashboardError('Some analytics could not be loaded. Showing available data.');
        }
      } catch {
        setDashboardError('Failed to load dashboard analytics. Please try again.');
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const lineChartData = performanceData.map((item) => ({
    label: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
    score: item.score,
  }));

  const barChartData = [
    { category: 'Technical', score: categoryScores.technical || 0 },
    { category: 'Communication', score: categoryScores.communication || 0 },
    { category: 'Problem Solving', score: categoryScores.problemSolving || 0 },
    { category: 'Confidence', score: categoryScores.confidence || 0 },
  ];

  const pieData = [
    { name: 'Frontend', value: skillDistribution.frontend || 0 },
    { name: 'Backend', value: skillDistribution.backend || 0 },
    { name: 'Tools', value: skillDistribution.tools || 0 },
  ];

  const averageScoreTrend =
    performanceData.length > 1
      ? performanceData[performanceData.length - 1].score - performanceData[performanceData.length - 2].score
      : 0;

  const bestScoreTrend =
    performanceData.length > 1
      ? Math.max(0, summary.bestScore - performanceData[performanceData.length - 2].score)
      : 0;

  const hasLineData = lineChartData.length > 0;
  const hasBarData = barChartData.some((item) => item.score > 0);
  const hasPieData = pieData.some((item) => item.value > 0);

  // Build analyticsData from fetched pieces so components can switch to a single source
  const analyticsData = {
    performanceTrend: performanceData || [],
    categoryScores: categoryScores || {},
    skillDistribution: skillDistribution || {},
    averageScore: summary.averageScore || 0,
    bestScore: summary.bestScore || 0,
    totalInterviews: summary.totalInterviews || 0,
    totalResumes: summary.totalResumes || 0,
    roleReadiness: insights.roleReadiness || 0,
    weakAreas: insights.weakAreas || [],
    suggestions: insights.suggestions || [],
  };

  const finalAnalytics = analyticsData;

  // Re-derived chart datasets from finalAnalytics
  const finalLineData = (finalAnalytics.performanceTrend || []).map((item) => ({
    label: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
    score: item.score,
  }));

  const finalBarData = [
    { category: 'Technical', score: finalAnalytics.categoryScores.technical || 0 },
    { category: 'Communication', score: finalAnalytics.categoryScores.communication || 0 },
    { category: 'Problem Solving', score: finalAnalytics.categoryScores.problemSolving || 0 },
    { category: 'Confidence', score: finalAnalytics.categoryScores.confidence || 0 },
  ];

  const finalPieData = [
    { name: 'Frontend', value: finalAnalytics.skillDistribution.frontend || 0 },
    { name: 'Backend', value: finalAnalytics.skillDistribution.backend || 0 },
    { name: 'Tools', value: finalAnalytics.skillDistribution.tools || 0 },
  ];

  const finalAverageScoreTrend =
    finalAnalytics.performanceTrend.length > 1
      ? finalAnalytics.performanceTrend[finalAnalytics.performanceTrend.length - 1].score -
        finalAnalytics.performanceTrend[finalAnalytics.performanceTrend.length - 2].score
      : 0;

  const finalBestScoreTrend =
    finalAnalytics.performanceTrend.length > 1
      ? Math.max(0, finalAnalytics.bestScore - finalAnalytics.performanceTrend[finalAnalytics.performanceTrend.length - 2].score)
      : 0;

  const hasFinalLineData = finalLineData.length > 0;
  const hasFinalBarData = finalBarData.some((item) => item.score > 0);
  const hasFinalPieData = finalPieData.some((item) => item.value > 0);

  const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b'];

  const dashboardCards = [
    {
      title: 'Start AI Interview',
      description: 'Launch a new role-focused interview session with AI-generated questions and real-time scoring.',
      cta: 'Begin Interview',
      icon: Bot,
      color: 'green',
      onClick: () => navigate('/new-interview'),
    },
    {
      title: 'Upload Resume',
      description: 'Upload and analyze your resume to identify strengths, gaps, and role alignment opportunities.',
      cta: 'Upload Now',
      icon: FileText,
      color: 'blue',
      onClick: () => navigate('/upload'),
    },
    {
      title: 'View Progress',
      description: 'Track your interview scores, consistency trends, and performance insights over time.',
      cta: 'View Reports',
      icon: BarChart3,
      color: 'purple',
      onClick: () => navigate('/progress'),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white mb-8 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome Back! 👋</h1>
        <p className="text-blue-100 text-lg">
          Let's continue your journey. Start an interview, upload your resume, or review your progress.
        </p>
      </div>

      {dashboardError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          {dashboardError}
        </div>
      )}

      {dashboardLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {dashboardCards.map((card) => (
            <DashboardCard key={card.title} {...card} />
          ))}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Your Performance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Interviews" value={finalAnalytics.totalInterviews} icon={Zap} color="blue" trendLabel="All time" />
          <StatCard
            title="Average Score"
            value={finalAnalytics.averageScore}
            unit="%"
            icon={TrendingUp}
            color="green"
            trend={finalAverageScoreTrend}
            trendLabel={`${finalAverageScoreTrend > 0 ? '+' : ''}${finalAverageScoreTrend}% from previous`}
          />
          <StatCard
            title="Best Score"
            value={finalAnalytics.bestScore}
            unit="%"
            icon={Award}
            color="purple"
            trend={finalBestScoreTrend}
            trendLabel={`${finalBestScoreTrend > 0 ? '+' : ''}${finalBestScoreTrend}% from previous`}
          />
          <StatCard title="Resumes Uploaded" value={finalAnalytics.totalResumes} icon={FileText} color="amber" trendLabel="For analysis" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Executive Snapshot</h2>
        </div>
        {dashboardLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl shadow-md p-6 bg-white hover:shadow-lg transition border border-slate-200">
              <p className="text-sm text-slate-500">Total Interviews</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{finalAnalytics.totalInterviews}</p>
            </div>
            <div className="rounded-xl shadow-md p-6 bg-white hover:shadow-lg transition border border-slate-200">
              <p className="text-sm text-slate-500">Average Score</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{finalAnalytics.averageScore}%</p>
            </div>
            <div className="rounded-xl shadow-md p-6 bg-white hover:shadow-lg transition border border-slate-200">
              <p className="text-sm text-slate-500">Best Score</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{finalAnalytics.bestScore}%</p>
            </div>
            <div className="rounded-xl shadow-md p-6 bg-white hover:shadow-lg transition border border-slate-200">
              <p className="text-sm text-slate-500">Total Resumes</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{finalAnalytics.totalResumes}</p>
            </div>
          </div>
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">Analytics Overview</h3>
          <span className="text-sm text-slate-500">Recharts powered</span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <LineChartIcon className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-semibold text-slate-700">Performance Over Time</p>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              {hasFinalLineData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={finalLineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  No performance data available yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700">Category-wise Scores</p>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              {hasFinalBarData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finalBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  No category score data available yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-slate-700">Skill Distribution</p>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              {hasFinalPieData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={finalPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                      {finalPieData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  No skill distribution data available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-violet-600" />
          <h3 className="text-xl font-semibold text-slate-900">Smart Insights</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Role Readiness</p>
            <p className="text-3xl font-bold text-indigo-700">{finalAnalytics.roleReadiness}%</p>
            <p className="text-sm text-slate-600 mt-1">
  {latestRole
    ? `You are ${finalAnalytics.roleReadiness}% ready for ${latestRole} role.`
    : "Complete an interview to view your role readiness."}
</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Weak Areas</p>
            {finalAnalytics.weakAreas.length ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {finalAnalytics.weakAreas.map((item) => (
                  <li key={item} className="rounded-md bg-red-50 text-red-700 px-3 py-2 border border-red-100">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-700">No major weak areas detected from current data.</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Suggestions</p>
            {finalAnalytics.suggestions.length ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {finalAnalytics.suggestions.map((suggestion, index) => (
                  <li key={`${suggestion}-${index}`} className="rounded-md bg-blue-50 text-blue-800 px-3 py-2 border border-blue-100">
                    {suggestion}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No suggestions yet. Complete more interviews to get guidance.</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-3">Quick Tips for Better Results:</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>Practice speaking clearly and maintain steady eye contact with your camera</li>
          <li>Answer with at least 20 words to provide substantial responses</li>
          <li>Take your time selecting a confidence level before submitting</li>
          <li>Review your previous interview evaluations to track progress</li>
        </ul>
      </Card>
    </div>
  );
};

export default Dashboard;
