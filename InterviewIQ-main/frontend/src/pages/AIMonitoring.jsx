
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAIMonitoringData } from '../services/aiMonitoringService';

const formatNumber = (value = 0) => Number(value || 0).toLocaleString('en-IN');

const formatLatency = (value = 0) => `${formatNumber(value)} ms`;

const formatDate = (dateString) => {
  if (!dateString) return '—';

  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
};

const formatFeatureName = (name = '') =>
  name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const percentage = (value, total) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

function StatCard({ title, value, subtitle, icon, accent = 'blue' }) {
  const accentStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-semibold ${accentStyles[accent]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function UsageTrendChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        No usage data available for this period.
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.requests || 0), 1);

  return (
    <div className="mt-5">
      <div className="flex h-56 items-end gap-2 overflow-x-auto border-b border-gray-100 pb-2">
        {data.map((item, index) => {
          const height = Math.max(
            (Number(item.requests || 0) / maxValue) * 100,
            item.requests ? 5 : 0
          );

          return (
            <div
              key={`${item._id?.year}-${item._id?.month}-${item._id?.day}-${index}`}
              className="group flex min-w-[24px] flex-1 flex-col items-center justify-end"
            >
              <div className="mb-2 text-xs text-gray-500 opacity-0 transition group-hover:opacity-100">
                {item.requests}
              </div>

              <div
                title={`${item.requests} requests`}
                className="w-full max-w-[42px] rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition hover:from-blue-700 hover:to-blue-500"
                style={{ height: `${height}%`, minHeight: item.requests ? '4px' : '0px' }}
              />

              <span className="mt-2 whitespace-nowrap text-[10px] text-gray-400">
                {item._id
                  ? `${String(item._id.day).padStart(2, '0')}/${String(
                      item._id.month
                    ).padStart(2, '0')}`
                  : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BreakdownList({
  title,
  data = [],
  labelFormatter = (value) => value || 'Unknown',
  total = 0,
  emptyMessage = 'No data available.',
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>

      {!data.length ? (
        <div className="flex h-36 items-center justify-center text-sm text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {data.map((item, index) => {
            const label = labelFormatter(item._id);
            const share = percentage(item.requests, total);

            return (
              <div key={`${label}-${index}`}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span
                    className="truncate text-sm font-medium text-gray-700"
                    title={label}
                  >
                    {label}
                  </span>

                  <span className="whitespace-nowrap text-xs text-gray-500">
                    {formatNumber(item.requests)} · {share}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${share}%` }}
                  />
                </div>

                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>Avg. {formatLatency(item.averageLatency)}</span>
                  <span>{formatNumber(item.tokens)} tokens</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const isSuccess = status === 'success';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      {isSuccess ? 'Success' : 'Failure'}
    </span>
  );
}

export default function AIMonitoring() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');

      try {
        const result = await getAIMonitoringData(days);
        setData(result);
      } catch (err) {
        setError(err.message || 'Unable to load AI monitoring analytics.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const overview = data?.overview || {};

  const totalFeatureRequests = useMemo(
    () => (data?.featureBreakdown || []).reduce((sum, item) => sum + (item.requests || 0), 0),
    [data]
  );

  const totalProviderRequests = useMemo(
    () => (data?.providerBreakdown || []).reduce((sum, item) => sum + (item.requests || 0), 0),
    [data]
  );

  const totalModelRequests = useMemo(
    () => (data?.modelBreakdown || []).reduce((sum, item) => sum + (item.requests || 0), 0),
    [data]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm text-gray-500">
            Loading AI monitoring analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                ✦
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                AI Monitoring
              </h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Monitor AI performance, usage, reliability and token consumption.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-60"
            >
              {refreshing ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={() => fetchData(true)}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Status Banner */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              AI monitoring is active
            </p>
            <p className="text-xs text-emerald-700">
              Analytics are calculated from recorded AI requests.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Requests"
            value={formatNumber(overview.totalRequests)}
            subtitle={`${days}-day period`}
            icon="↗"
            accent="blue"
          />

          <StatCard
            title="Success Rate"
            value={`${overview.successRate || 0}%`}
            subtitle={`${formatNumber(overview.successfulRequests)} successful`}
            icon="✓"
            accent="green"
          />

          <StatCard
            title="Failed Requests"
            value={formatNumber(overview.failedRequests)}
            subtitle="AI errors"
            icon="!"
            accent="red"
          />

          <StatCard
            title="Avg. Latency"
            value={formatLatency(overview.averageLatency)}
            subtitle="Response time"
            icon="◷"
            accent="purple"
          />

          <StatCard
            title="Total Tokens"
            value={formatNumber(overview.totalTokens)}
            subtitle={`${formatNumber(overview.promptTokens)} prompt`}
            icon="▤"
            accent="orange"
          />
        </div>

        {/* Usage Trend */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                AI Request Activity
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Daily AI requests over the selected period
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
              {formatNumber(overview.totalRequests)} requests
            </div>
          </div>

          <UsageTrendChart data={data?.dailyUsage || []} />
        </div>

        {/* Feature + Provider breakdown */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BreakdownList
            title="Usage by Feature"
            data={data?.featureBreakdown || []}
            total={totalFeatureRequests}
            labelFormatter={formatFeatureName}
          />

          <BreakdownList
            title="Usage by Provider"
            data={data?.providerBreakdown || []}
            total={totalProviderRequests}
            labelFormatter={(value) =>
              value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'
            }
          />
        </div>

        {/* Model breakdown */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Model Performance
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Requests, latency and token usage by model
            </p>
          </div>

          {!data?.modelBreakdown?.length ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No model data available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="pb-3 pr-4 font-medium">Model</th>
                    <th className="pb-3 pr-4 font-medium">Requests</th>
                    <th className="pb-3 pr-4 font-medium">Success</th>
                    <th className="pb-3 pr-4 font-medium">Failures</th>
                    <th className="pb-3 pr-4 font-medium">Avg Latency</th>
                    <th className="pb-3 font-medium">Tokens</th>
                  </tr>
                </thead>

                <tbody>
                  {data.modelBreakdown.map((model, index) => (
                    <tr
                      key={`${model._id?.model}-${index}`}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-4 pr-4">
                        <div className="font-medium text-gray-800">
                          {model._id?.model || 'Unknown Model'}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {model._id?.provider || 'Unknown provider'}
                        </div>
                      </td>

                      <td className="py-4 pr-4 text-sm text-gray-700">
                        {formatNumber(model.requests)}
                      </td>

                      <td className="py-4 pr-4">
                        <span className="text-sm font-medium text-emerald-600">
                          {formatNumber(model.successfulRequests)}
                        </span>
                      </td>

                      <td className="py-4 pr-4">
                        <span className="text-sm font-medium text-red-600">
                          {formatNumber(model.failedRequests)}
                        </span>
                      </td>

                      <td className="py-4 pr-4 text-sm text-gray-700">
                        {formatLatency(model.averageLatency)}
                      </td>

                      <td className="py-4 text-sm text-gray-700">
                        {formatNumber(model.tokens)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Failures */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent AI Failures
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Latest failed AI requests requiring investigation
              </p>
            </div>

            <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
              {data?.recentFailures?.length || 0} failures
            </span>
          </div>

          {!data?.recentFailures?.length ? (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 py-10 text-center">
              <div className="mb-2 text-2xl text-emerald-500">✓</div>
              <p className="font-medium text-emerald-700">
                No AI failures recorded
              </p>
              <p className="mt-1 text-sm text-gray-500">
                All logged AI requests are currently successful.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="pb-3 pr-4 font-medium">Feature</th>
                    <th className="pb-3 pr-4 font-medium">Provider / Model</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Latency</th>
                    <th className="pb-3 pr-4 font-medium">Error</th>
                    <th className="pb-3 font-medium">Time</th>
                  </tr>
                </thead>

                <tbody>
                  {data.recentFailures.map((failure) => (
                    <tr
                      key={failure._id}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-4 pr-4 text-sm font-medium text-gray-800">
                        {formatFeatureName(failure.feature)}
                      </td>

                      <td className="py-4 pr-4">
                        <div className="text-sm text-gray-800">
                          {failure.provider}
                        </div>
                        <div className="mt-1 max-w-[220px] truncate text-xs text-gray-400">
                          {failure.model}
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <StatusBadge status={failure.status} />
                      </td>

                      <td className="py-4 pr-4 text-sm text-gray-700">
                        {formatLatency(failure.latencyMs)}
                      </td>

                      <td className="py-4 pr-4">
                        <div className="max-w-[180px] truncate text-sm text-red-600">
                          {failure.errorCode || failure.errorMessage || 'Unknown error'}
                        </div>
                      </td>

                      <td className="whitespace-nowrap py-4 text-xs text-gray-500">
                        {new Date(failure.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Token details */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Prompt Tokens</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatNumber(overview.promptTokens)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Input tokens sent to AI
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Completion Tokens</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatNumber(overview.completionTokens)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Tokens generated by AI
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pb-6 text-center text-xs text-gray-400">
          InterviewIQ AI Monitoring · Data based on recorded AI usage
        </div>
      </div>
    </div>
  );
}
