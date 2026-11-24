
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAIMonitoringData } from '../services/aiMonitoringService';
import { askAdminCopilot } from '../services/aiAdminCopilotService';


// Cost rates are placeholders until configured with verified provider pricing.
// Rates are expressed per 1 million tokens.
const AI_MODEL_PRICING = {
  'openai/gpt-oss-20b': {
    inputPerMillion: null,
    outputPerMillion: null,
  },
};

const getEstimatedCost = (promptTokens = 0, completionTokens = 0, model = '') => {
  const pricing = AI_MODEL_PRICING[model];

  if (!pricing || pricing.inputPerMillion == null || pricing.outputPerMillion == null) {
    return null;
  }

  return (
    (promptTokens / 1_000_000) * pricing.inputPerMillion +
    (completionTokens / 1_000_000) * pricing.outputPerMillion
  );
};

const formatCurrency = (value) =>
  value == null
    ? 'Not configured'
    : `₹${Number(value).toFixed(4)}`;



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


function UsageTrendChart({ data = [], days = 30 }) {
  const dateMap = new Map();

  data.forEach((item) => {
    if (!item._id) return;

    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
    dateMap.set(key, item);
  });

  const today = new Date();
  const chartDays = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    chartDays.push({
      key,
      date,
      requests: dateMap.get(key)?.requests || 0,
      tokens: dateMap.get(key)?.tokens || 0,
      latency: dateMap.get(key)?.averageLatency || 0,
    });
  }

  const maxValue = Math.max(...chartDays.map((item) => item.requests), 1);

  const labelInterval = days === 7 ? 1 : days === 30 ? 3 : 7;

  return (
    <div className="mt-6">
      {/* Chart legend */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
          AI Requests
        </div>
        <span className="text-xs text-gray-400">
          Peak: {maxValue} requests/day
        </span>
      </div>

      {/* Chart area */}
      <div className="w-full overflow-x-auto pb-2">
        <div
          className="flex h-[260px] min-w-full items-end gap-1 border-b border-gray-100"
          style={{
            minWidth: days === 90 ? '900px' : days === 30 ? '600px' : '100%',
          }}
        >
          {chartDays.map((item, index) => {
            const barHeight =
              item.requests > 0
                ? Math.max((item.requests / maxValue) * 190, 8)
                : 3;

            const showLabel = index % labelInterval === 0 || index === days - 1;

            return (
              <div
                key={item.key}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full z-20 mb-2 hidden min-w-[120px] rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  <p className="font-semibold">
                    {item.date.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="mt-1">{item.requests} requests</p>
                  <p>{item.tokens.toLocaleString('en-IN')} tokens</p>
                  {item.latency > 0 && <p>{Math.round(item.latency)} ms avg.</p>}
                </div>

                {/* Bar */}
                <div
                  className={`w-full max-w-[36px] rounded-t-md transition-all duration-200 ${
                    item.requests > 0
                      ? 'bg-blue-500 hover:bg-blue-700'
                      : 'bg-gray-100'
                  }`}
                  style={{
                    height: `${barHeight}px`,
                    minHeight: '3px',
                  }}
                />

                {/* Date labels */}
                <div className="mt-2 h-5 text-center">
                  {showLabel && (
                    <span className="whitespace-nowrap text-[10px] text-gray-400">
                      {item.date.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom summary */}
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>{days} days displayed</span>
        <span>
          {chartDays.filter((item) => item.requests > 0).length} active days
        </span>
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

function AICostPerformanceInsights({ overview = {}, featureBreakdown = [], modelBreakdown = [] }) {
  const totalTokens = Number(overview.totalTokens || 0);
  const promptTokens = Number(overview.promptTokens || 0);
  const completionTokens = Number(overview.completionTokens || 0);

  const promptRatio = totalTokens > 0 ? promptTokens / totalTokens : 0;
  const completionRatio = totalTokens > 0 ? completionTokens / totalTokens : 0;

  const models = modelBreakdown || [];

  const estimatedCost = models.reduce((total, model) => {
    const modelName = model._id?.model || '';
    const modelTokens = Number(model.tokens || 0);

    const estimatedPrompt = modelTokens * promptRatio;
    const estimatedCompletion = modelTokens * completionRatio;

    const cost = getEstimatedCost(
      estimatedPrompt,
      estimatedCompletion,
      modelName
    );

    return cost == null ? null : total + cost;
  }, 0);

  const costConfigured = models.length > 0 && estimatedCost !== null;

  const slowestFeature = [...featureBreakdown].sort(
    (a, b) => Number(b.averageLatency || 0) - Number(a.averageLatency || 0)
  )[0];

  const highestUsageFeature = [...featureBreakdown].sort(
    (a, b) => Number(b.tokens || 0) - Number(a.tokens || 0)
  )[0];

  const promptShare = totalTokens > 0
    ? Math.round((promptTokens / totalTokens) * 100)
    : 0;

  const completionShare = totalTokens > 0
    ? Math.round((completionTokens / totalTokens) * 100)
    : 0;

  const maxTokens = Math.max(
    ...featureBreakdown.map((item) => Number(item.tokens || 0)),
    1
  );

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Cost & Performance Insights
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          AI resource consumption and performance analysis for the selected period.
        </p>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Estimated cost */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Estimated AI Cost</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {costConfigured ? formatCurrency(estimatedCost) : 'Not configured'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {costConfigured
              ? 'Estimated from token usage'
              : 'Configure model rates to calculate'}
          </p>
        </div>

        {/* Average cost */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Cost per Request</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {costConfigured && overview.totalRequests > 0
              ? formatCurrency(estimatedCost / overview.totalRequests)
              : 'Not configured'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Average estimated cost
          </p>
        </div>

        {/* Slowest feature */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Slowest Feature</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {slowestFeature
              ? formatLatency(slowestFeature.averageLatency)
              : '—'}
          </p>
          <p className="mt-1 truncate text-xs text-gray-400">
            {slowestFeature
              ? formatFeatureName(slowestFeature._id)
              : 'No feature data'}
          </p>
        </div>

        {/* Highest token usage */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Highest Token Usage</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {highestUsageFeature
              ? formatNumber(highestUsageFeature.tokens)
              : '0'}
          </p>
          <p className="mt-1 truncate text-xs text-gray-400">
            {highestUsageFeature
              ? formatFeatureName(highestUsageFeature._id)
              : 'No feature data'}
          </p>
        </div>
      </div>

      {/* Token distribution */}
      <div className="mt-6 rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Token Distribution
        </h3>

        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-gray-100">
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${promptShare}%` }}
            title={`Prompt: ${promptShare}%`}
          />
          <div
            className="bg-purple-500 transition-all"
            style={{ width: `${completionShare}%` }}
            title={`Completion: ${completionShare}%`}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Prompt: {formatNumber(promptTokens)} ({promptShare}%)
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            Completion: {formatNumber(completionTokens)} ({completionShare}%)
          </div>
        </div>
      </div>

      {/* Feature resource usage */}
      <div className="mt-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-800">
          Resource Consumption by Feature
        </h3>

        {!featureBreakdown.length ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No feature usage data available.
          </p>
        ) : (
          <div className="space-y-4">
            {[...featureBreakdown]
              .sort((a, b) => Number(b.tokens || 0) - Number(a.tokens || 0))
              .map((feature, index) => {
                const tokens = Number(feature.tokens || 0);
                const percentage = Math.round((tokens / maxTokens) * 100);

                return (
                  <div key={`${feature._id}-${index}`}>
                    <div className="mb-1 flex justify-between gap-3">
                      <span className="truncate text-sm font-medium text-gray-700">
                        {formatFeatureName(feature._id)}
                      </span>
                      <span className="whitespace-nowrap text-xs text-gray-500">
                        {formatNumber(tokens)} tokens
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                      <span>{percentage}% of highest feature</span>
                      <span>{formatLatency(feature.averageLatency)} avg.</span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
        Cost values are estimates, not actual provider invoices. Prompt/completion
        token allocation by feature is approximated using the overall token ratio.
        Configure verified model pricing before relying on cost estimates.
      </div>
    </div>
  );
}

function AIHealthCenter({ overview = {}, featureBreakdown = [] }) {
  const totalRequests = Number(overview.totalRequests || 0);
  const failedRequests = Number(overview.failedRequests || 0);
  const successRate = Number(overview.successRate || 0);
  const avgLatency = Number(overview.averageLatency || 0);

  const failureRate =
    totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

  const features = featureBreakdown || [];

  const avgFeatureLatency =
    features.length > 0
      ? features.reduce((sum, f) => sum + Number(f.averageLatency || 0), 0) /
        features.length
      : 0;

  const avgTokensPerRequest =
    features.length > 0
      ? features.reduce((sum, f) => {
          const requests = Number(f.requests || 0);
          const tokens = Number(f.tokens || 0);
          return sum + (requests > 0 ? tokens / requests : 0);
        }, 0) / features.length
      : 0;

  const signals = [];

  if (totalRequests === 0) {
    signals.push({
      level: 'info',
      title: 'Insufficient monitoring data',
      detail: 'No AI requests are available in the selected period yet.',
    });
  } else {
    if (failureRate >= 20) {
      signals.push({
        level: 'critical',
        title: 'High AI failure rate',
        detail: `${failureRate.toFixed(1)}% of recorded requests failed. Investigate the provider and error logs.`,
      });
    } else if (failedRequests > 0) {
      signals.push({
        level: 'warning',
        title: 'AI failures detected',
        detail: `${failedRequests} failed request(s) detected in the selected period.`,
      });
    }

    if (avgLatency >= 5000) {
      signals.push({
        level: 'critical',
        title: 'AI response latency is very high',
        detail: `Average response time is ${Math.round(avgLatency)} ms. This may negatively impact the user experience.`,
      });
    } else if (avgLatency >= 2000) {
      signals.push({
        level: 'warning',
        title: 'AI response latency is elevated',
        detail: `Average response time is ${Math.round(avgLatency)} ms. Consider investigating slower AI operations.`,
      });
    }

    features.forEach((feature) => {
      const featureLatency = Number(feature.averageLatency || 0);
      const featureRequests = Number(feature.requests || 0);
      const featureTokens = Number(feature.tokens || 0);
      const featureName = formatFeatureName(feature._id);

      if (
        avgFeatureLatency > 0 &&
        featureLatency > Math.max(1500, avgFeatureLatency * 1.5)
      ) {
        signals.push({
          level: featureLatency >= 5000 ? 'critical' : 'warning',
          title: `${featureName} is slower than other features`,
          detail: `Average latency is ${Math.round(featureLatency)} ms, noticeably above the feature average of ${Math.round(avgFeatureLatency)} ms.`,
        });
      }

      const tokensPerRequest =
        featureRequests > 0 ? featureTokens / featureRequests : 0;

      if (
        avgTokensPerRequest > 0 &&
        tokensPerRequest > avgTokensPerRequest * 1.5
      ) {
        signals.push({
          level: 'warning',
          title: `${featureName} has high token consumption`,
          detail: `Approximately ${Math.round(tokensPerRequest).toLocaleString('en-IN')} tokens per request, higher than the current feature-level baseline.`,
        });
      }
    });

    if (signals.length === 0) {
      signals.push({
        level: 'healthy',
        title: 'No major risk signals detected',
        detail: 'Current request success, latency, and feature usage are within the configured monitoring thresholds.',
      });
    }
  }

  const failurePenalty = Math.min(failureRate * 2, 50);

  const latencyPenalty =
    avgLatency <= 1000
      ? 0
      : avgLatency <= 2000
        ? 10
        : avgLatency <= 5000
          ? 20
          : 35;

  const anomalyPenalty = Math.min(
    signals.filter((signal) => signal.level === 'warning').length * 5 +
      signals.filter((signal) => signal.level === 'critical').length * 15,
    30
  );

  const healthScore =
    totalRequests === 0
      ? null
      : Math.max(
          0,
          Math.round(100 - failurePenalty - latencyPenalty - anomalyPenalty)
        );

  const healthStatus =
    healthScore === null
      ? 'No Data'
      : healthScore >= 80
        ? 'Healthy'
        : healthScore >= 55
          ? 'Needs Attention'
          : 'Critical';

  const statusStyles = {
    Healthy: {
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      bar: 'bg-emerald-500',
    },
    'Needs Attention': {
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-500',
    },
    Critical: {
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      bar: 'bg-red-500',
    },
    'No Data': {
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      bar: 'bg-gray-400',
    },
  };

  const style = statusStyles[healthStatus];
  const criticalCount = signals.filter((s) => s.level === 'critical').length;
  const warningCount = signals.filter((s) => s.level === 'warning').length;

  const signalStyles = {
    healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-gray-200 bg-gray-50 text-gray-600',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    critical: 'border-red-200 bg-red-50 text-red-800',
  };

  const signalIcons = {
    healthy: '✓',
    info: 'i',
    warning: '⚠',
    critical: '!',
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            AI Reliability & Health Center
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Automated health assessment and risk signals for InterviewIQ AI.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
            {criticalCount} Critical
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            {warningCount} Warning
          </span>
        </div>
      </div>

      <div className={`rounded-2xl border ${style.border} ${style.bg} p-5`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-4 border-white shadow-sm">
            <span className={`text-3xl font-bold ${style.color}`}>
              {healthScore === null ? '—' : healthScore}
            </span>
            <span className="text-xs text-gray-500">out of 100</span>
          </div>

          <div className="flex-1">
            <p className={`text-xl font-bold ${style.color}`}>
              {healthStatus}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {healthStatus === 'Healthy'
                ? 'AI services are operating within the configured monitoring thresholds.'
                : healthStatus === 'Needs Attention'
                  ? 'Some performance or reliability signals require administrator attention.'
                  : healthStatus === 'Critical'
                    ? 'Important reliability or performance issues have been detected.'
                    : 'Record AI requests to generate a health assessment.'}
            </p>

            {healthScore !== null && (
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/80">
                <div
                  className={`h-full rounded-full ${style.bar} transition-all`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
              <span>Success rate: {successRate}%</span>
              <span>Failure rate: {failureRate.toFixed(1)}%</span>
              <span>Avg latency: {Math.round(avgLatency).toLocaleString('en-IN')} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="mt-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          Automated Risk & Health Signals
        </h3>

        <div className="space-y-3">
          {signals.map((signal, index) => (
            <div
              key={`${signal.title}-${index}`}
              className={`flex items-start gap-3 rounded-xl border p-4 ${signalStyles[signal.level]}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold">
                {signalIcons[signal.level]}
              </span>

              <div>
                <p className="text-sm font-semibold">{signal.title}</p>
                <p className="mt-1 text-xs leading-5 opacity-90">
                  {signal.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Health score and alerts are generated using threshold-based rules, not a trained anomaly-detection model.
      </div>
    </div>
  );
}

function AIIncidentTimeline({ failures = [] }) {
  const sortedFailures = [...failures].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const criticalCount = sortedFailures.filter(
    (failure) => Number(failure.latencyMs || 0) >= 5000
  ).length;

  const getSeverity = (failure) => {
    if (Number(failure.latencyMs || 0) >= 5000) {
      return {
        label: 'High Impact',
        style: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
      };
    }

    return {
      label: 'Failure',
      style: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    };
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            AI Incident Timeline
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Chronological investigation of failed AI operations.
          </p>
        </div>

        <div className="flex gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
            {sortedFailures.length} incidents
          </span>
          <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
            {criticalCount} high impact
          </span>
        </div>
      </div>

      {!sortedFailures.length ? (
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 py-10 text-center">
          <div className="mb-2 text-2xl text-emerald-500">✓</div>
          <p className="font-medium text-emerald-700">
            No incidents to investigate
          </p>
          <p className="mt-1 text-sm text-gray-500">
            No failed AI requests have been recorded in this period.
          </p>
        </div>
      ) : (
        <div className="relative ml-2">
          {/* Timeline line */}
          <div className="absolute bottom-3 left-[11px] top-3 w-px bg-gray-200" />

          <div className="space-y-5">
            {sortedFailures.map((failure, index) => {
              const severity = getSeverity(failure);

              return (
                <div key={failure._id || index} className="relative pl-9">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-1.5 z-10 h-6 w-6 rounded-full border-4 border-white ${severity.dot} shadow-sm`}
                  />

                  <div className="rounded-xl border border-gray-200 p-4 transition hover:border-gray-300 hover:shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severity.style}`}
                        >
                          {severity.label}
                        </span>

                        <StatusBadge status={failure.status} />
                      </div>

                      <span className="text-xs text-gray-400">
                        {failure.createdAt
                          ? new Date(failure.createdAt).toLocaleString('en-IN')
                          : 'Time unavailable'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-gray-900">
                      {formatFeatureName(failure.feature || 'unknown')}
                    </h3>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Provider</p>
                        <p className="mt-1 text-sm font-medium text-gray-700">
                          {failure.provider || 'Unknown'}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Model</p>
                        <p className="mt-1 break-all text-sm font-medium text-gray-700">
                          {failure.model || 'Unknown'}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Latency</p>
                        <p className="mt-1 text-sm font-medium text-gray-700">
                          {formatLatency(failure.latencyMs)}
                        </p>
                      </div>
                    </div>

                    {(failure.errorCode || failure.errorMessage) && (
                      <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                        <p className="text-xs font-semibold text-red-700">
                          Error Details
                        </p>
                        <p className="mt-1 break-words text-sm text-red-600">
                          {failure.errorCode && `${failure.errorCode}: `}
                          {failure.errorMessage || 'No additional error details'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        Incidents are based on logged failed requests. “High Impact” is a UI
        classification based on latency of 5 seconds or more, not a root-cause
        diagnosis.
      </div>
    </div>
  );
}


function AIAdminCopilot() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const recognitionRef = useRef(null);
  const questionPrefixRef = useRef('');

  const suggestions = [
    'Which feature consumes the most tokens?',
    'What are the biggest AI performance issues?',
    'Analyze the recent AI failures.',
    'How can I improve AI response latency?',
  ];

  // Stop voice recognition safely
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Start / stop voice input
  const toggleVoiceInput = () => {
    setVoiceError('');

    // Stop if already listening
    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    // Browser compatibility check
    if (!SpeechRecognition) {
      setVoiceError(
        'Voice input is not supported in this browser. Try Google Chrome.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognitionRef.current = recognition;

      // Preserve any text already typed
      questionPrefixRef.current = question.trim()
        ? question.trim() + ' '
        : '';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError('');
      };

      recognition.onresult = (event) => {
        let transcript = '';

        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        setQuestion(questionPrefixRef.current + transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError(
            'Microphone permission denied. Please allow microphone access in your browser.'
          );
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Please try speaking again.');
        } else if (event.error === 'network') {
          setVoiceError('Network error occurred during voice recognition.');
        } else {
          setVoiceError('Voice input failed. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      setIsListening(false);
      setVoiceError('Unable to start microphone. Please try again.');
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;

        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Recognition may already be stopped
        }
      }
    };
  }, []);

  const handleAsk = async (customQuestion) => {
    const q = (customQuestion || question).trim();

    if (!q || loading) return;

    // Stop voice input before submitting
    stopListening();
    setVoiceError('');

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: q },
    ]);

    setQuestion('');
    setLoading(true);

    try {
      const result = await askAdminCopilot(q);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.answer,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: error.message || 'Unable to get AI response.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-sm">
            ✦
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              AI Admin Copilot
            </h2>
            <p className="text-xs text-gray-500">
              Ask questions about your AI platform performance
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            stopListening();
            setMessages([]);
            setQuestion('');
            setVoiceError('');
          }}
          disabled={messages.length === 0 || loading}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-white hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear chat
        </button>
      </div>

      {/* Chat Area */}
      <div className="max-h-[420px] min-h-[220px] overflow-y-auto p-5">

        {messages.length === 0 ? (
          <div className="py-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
              ✦
            </div>

            <h3 className="font-semibold text-gray-800">
              Your AI analytics assistant
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Ask questions and get insights from your AI monitoring data.
            </p>

            {/* Suggested Questions */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleAsk(suggestion)}
                  disabled={loading}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-xs text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-indigo-600 text-white'
                      : message.role === 'error'
                      ? 'rounded-bl-md border border-red-200 bg-red-50 text-red-700'
                      : 'rounded-bl-md border border-gray-200 bg-gray-50 text-gray-800'
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold opacity-75">
                    {message.role === 'user'
                      ? 'You'
                      : message.role === 'error'
                      ? 'Error'
                      : '✦ Admin Copilot'}
                  </p>

                  <div className="whitespace-pre-wrap text-sm leading-6">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-4 flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
                </div>

                <span className="text-xs text-gray-500">
                  Copilot is analyzing your data...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 bg-gray-50 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-end gap-3"
        >
          {/* Question Input */}
          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setVoiceError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder={
              isListening
                ? 'Listening... speak your question'
                : 'Ask about AI usage, performance, failures...'
            }
            rows={2}
            disabled={loading}
            className={`max-h-32 min-h-[48px] flex-1 resize-y rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 disabled:bg-gray-100 ${
              isListening
                ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-100'
            }`}
          />

          {/* Microphone Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={loading}
            title={isListening ? 'Stop recording' : 'Speak your question'}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isListening
                ? 'animate-pulse border-red-300 bg-red-100 text-red-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            {isListening ? (
              <span className="text-lg">■</span>
            ) : (
              <span className="text-xl">🎤</span>
            )}
          </button>

          {/* Ask Button */}
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Ask</span>
            <span>↑</span>
          </button>
        </form>

        {/* Listening Status */}
        {isListening && (
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-red-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Listening... Speak now. Click the microphone to stop.
          </div>
        )}

        {/* Voice Error */}
        {voiceError && (
          <p className="mt-2 text-xs text-red-600">
            {voiceError}
          </p>
        )}

        <p className="mt-2 text-xs text-gray-400">
          AI-generated insights based on recorded monitoring data.
          {` `}You can also use the microphone to ask questions by voice.
        </p>
      </div>
    </div>
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
        {/* AI Admin Copilot */}
<AIAdminCopilot />

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

        {/* AI Reliability & Health Center */}
<AIHealthCenter
  overview={overview}
  featureBreakdown={data?.featureBreakdown || []}
/>

{/* AI Cost & Performance Insights */}
<AICostPerformanceInsights
  overview={overview}
  featureBreakdown={data?.featureBreakdown || []}
  modelBreakdown={data?.modelBreakdown || []}
/>
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

          <UsageTrendChart
  data={data?.dailyUsage || []}
  days={days}
/>
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

{/* AI Incident Timeline */}
<AIIncidentTimeline
  failures={data?.recentFailures || []}
/>

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
