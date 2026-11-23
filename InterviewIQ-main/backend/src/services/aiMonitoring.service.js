import AIUsageLog from '../models/AIUsageLog.js';

const getDateRange = (days = 30) => {
  const safeDays = Math.min(Math.max(Number(days) || 30, 1), 365);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - safeDays);

  return { startDate, endDate, days: safeDays };
};

export const getAIMonitoringAnalytics = async (days = 30) => {
  const { startDate, endDate, days: safeDays } = getDateRange(days);

  const dateFilter = {
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  const [
    overviewResult,
    dailyUsage,
    featureBreakdown,
    providerBreakdown,
    modelBreakdown,
    recentFailures,
  ] = await Promise.all([
    // Overall metrics
    AIUsageLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          successfulRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
            },
          },
          failedRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failure'] }, 1, 0],
            },
          },
          averageLatency: { $avg: '$latencyMs' },
          totalLatency: { $sum: '$latencyMs' },
          totalTokens: { $sum: '$tokens.total' },
          promptTokens: { $sum: '$tokens.prompt' },
          completionTokens: { $sum: '$tokens.completion' },
        },
      },
    ]),

    // Daily usage trend
    AIUsageLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          requests: { $sum: 1 },
          successfulRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
            },
          },
          failedRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failure'] }, 1, 0],
            },
          },
          tokens: { $sum: '$tokens.total' },
          averageLatency: { $avg: '$latencyMs' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]),

    // Usage by feature
    AIUsageLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$feature',
          requests: { $sum: 1 },
          successfulRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
            },
          },
          failedRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failure'] }, 1, 0],
            },
          },
          averageLatency: { $avg: '$latencyMs' },
          tokens: { $sum: '$tokens.total' },
        },
      },
      { $sort: { requests: -1 } },
    ]),

    // Usage by provider
    AIUsageLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$provider',
          requests: { $sum: 1 },
          successfulRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
            },
          },
          failedRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failure'] }, 1, 0],
            },
          },
          averageLatency: { $avg: '$latencyMs' },
          tokens: { $sum: '$tokens.total' },
        },
      },
      { $sort: { requests: -1 } },
    ]),

    // Usage by model
    AIUsageLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            provider: '$provider',
            model: '$model',
          },
          requests: { $sum: 1 },
          successfulRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0],
            },
          },
          failedRequests: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failure'] }, 1, 0],
            },
          },
          averageLatency: { $avg: '$latencyMs' },
          tokens: { $sum: '$tokens.total' },
        },
      },
      { $sort: { requests: -1 } },
    ]),

    // Latest failed AI calls
    AIUsageLog.find({
      ...dateFilter,
      status: 'failure',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        'feature provider model latencyMs errorCode errorMessage createdAt metadata'
      )
      .lean(),
  ]);

  const overview = overviewResult[0] || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    totalLatency: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
  };

  const successRate =
    overview.totalRequests > 0
      ? (overview.successfulRequests / overview.totalRequests) * 100
      : 0;

  return {
    period: {
      days: safeDays,
      startDate,
      endDate,
    },

    overview: {
      totalRequests: overview.totalRequests || 0,
      successfulRequests: overview.successfulRequests || 0,
      failedRequests: overview.failedRequests || 0,
      successRate: Number(successRate.toFixed(2)),
      averageLatency: Math.round(overview.averageLatency || 0),
      totalLatency: overview.totalLatency || 0,
      totalTokens: overview.totalTokens || 0,
      promptTokens: overview.promptTokens || 0,
      completionTokens: overview.completionTokens || 0,
    },

    dailyUsage,

    featureBreakdown,

    providerBreakdown,

    modelBreakdown,

    recentFailures,
  };
};

export default {
  getAIMonitoringAnalytics,
};