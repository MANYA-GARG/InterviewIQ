
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import Evaluation from '../models/Evaluation.js';

const COMPLETED_STATUSES = ['completed', 'evaluated'];

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getStartOfDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Generate dates for the last 14 days (including today)
const generateLast14Days = () => {
  const result = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    result.push({
      date: date.toISOString().slice(0, 10),
      users: 0,
      interviews: 0,
    });
  }

  return result;
};

export const getAdminOverview = async () => {
  const todayStart = getStartOfToday();
  const last14DaysStart = getStartOfDaysAgo(13);
  const activeSince = getStartOfDaysAgo(7);

  const [
    totalUsers,
    activeUsers,
    totalInterviews,
    interviewsToday,
    averageScoreResult,
    popularRolesResult,
    userGrowthResult,
    interviewActivityResult,
    interviewStatusResult,
  ] = await Promise.all([
    // Total candidate accounts
    User.countDocuments({ role: 'user' }),

    // Active candidates: active accounts that logged in during the last 7 days
    User.countDocuments({
      role: 'user',
      accountStatus: 'ACTIVE',
      lastLoginAt: { $gte: activeSince },
    }),

    // Interviews that have been conducted
    Interview.countDocuments({
      status: { $in: COMPLETED_STATUSES },
    }),

    // Interviews completed today
    Interview.countDocuments({
      status: { $in: COMPLETED_STATUSES },
      completedAt: { $gte: todayStart },
    }),

    // Average AI evaluation score
    Evaluation.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: '$overallScore' },
        },
      },
    ]),

    // Most popular interview job roles
    Interview.aggregate([
      {
        $match: {
          status: { $in: COMPLETED_STATUSES },
          jobRole: { $exists: true, $ne: '' },
        },
      },
      {
        $group: {
          _id: '$jobRole',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),

    // New registrations per day over the last 14 days
    User.aggregate([
      {
        $match: {
          role: 'user',
          createdAt: { $gte: last14DaysStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Completed interviews per day over the last 14 days
    Interview.aggregate([
      {
        $match: {
          status: { $in: COMPLETED_STATUSES },
          completedAt: { $gte: last14DaysStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Distribution of all interview statuses
    Interview.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Fill missing dates with 0 so the charts have a continuous timeline
  const chartData = generateLast14Days();

  const userGrowthMap = new Map(
    userGrowthResult.map((item) => [item._id, item.count])
  );

  const interviewActivityMap = new Map(
    interviewActivityResult.map((item) => [item._id, item.count])
  );

  chartData.forEach((day) => {
    day.users = userGrowthMap.get(day.date) || 0;
    day.interviews = interviewActivityMap.get(day.date) || 0;
  });

  const averageInterviewScore =
    averageScoreResult.length > 0
      ? Number(averageScoreResult[0].average.toFixed(2))
      : 0;

  return {
    cards: {
      totalUsers,
      activeUsers,
      totalInterviews,
      interviewsToday,
      averageInterviewScore,
      mostPopularCategory: popularRolesResult[0]?._id || 'N/A',
    },

    charts: {
      userGrowth: chartData.map((day) => ({
        date: day.date,
        users: day.users,
      })),

      interviewActivity: chartData.map((day) => ({
        date: day.date,
        interviews: day.interviews,
      })),

      popularCategories: popularRolesResult.map((item) => ({
        category: item._id,
        count: item.count,
      })),

      interviewStatuses: interviewStatusResult.map((item) => ({
        status: item._id,
        count: item.count,
      })),
    },
  };
};

export default {
  getAdminOverview,
};
