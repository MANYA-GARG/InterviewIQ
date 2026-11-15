import mongoose from 'mongoose';
import Evaluation from '../models/Evaluation.js';
import Interview from '../models/Interview.js';
import Resume from '../models/Resume.js';
import Question from '../models/Question.js';

const FRONTEND_KEYWORDS = [
  'frontend',
  'front-end',
  'react',
  'angular',
  'vue',
  'html',
  'css',
  'javascript',
  'typescript',
  'tailwind',
  'redux',
  'next',
];

const BACKEND_KEYWORDS = [
  'backend',
  'back-end',
  'node',
  'express',
  'api',
  'rest',
  'graphql',
  'mongodb',
  'postgres',
  'mysql',
  'sql',
  'java',
  'spring',
  'django',
  'flask',
  'microservice',
  'system design',
];

const TOOL_KEYWORDS = [
  'git',
  'docker',
  'kubernetes',
  'jenkins',
  'ci',
  'cd',
  'github',
  'postman',
  'figma',
  'jira',
  'webpack',
  'vite',
  'aws',
  'azure',
  'gcp',
  'linux',
  'npm',
  'yarn',
];

class ReportService {
  _extractOverallScoreFromInterview(interview) {
    const directScore = interview?.evaluationReport?.overallScore;
    if (typeof directScore === 'number') {
      return directScore;
    }

    const assessmentScore = interview?.evaluationReport?.overallAssessment?.score;
    if (typeof assessmentScore === 'number') {
      return assessmentScore;
    }

    return null;
  }

  _extractCategoryScore(categorySource, key) {
    if (!categorySource) {
      return null;
    }

    const value = categorySource[key];
    if (typeof value === 'number') {
      return value;
    }

    if (value && typeof value.score === 'number') {
      return value.score;
    }

    return null;
  }

  _normalizeScore(score) {
    if (typeof score !== 'number' || Number.isNaN(score)) {
      return null;
    }
    return Math.max(0, Math.min(100, score));
  }

  _bucketSkill(skillText, buckets) {
    const normalized = String(skillText || '').toLowerCase();
    if (!normalized) {
      return;
    }

    if (FRONTEND_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      buckets.frontend += 1;
      return;
    }

    if (BACKEND_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      buckets.backend += 1;
      return;
    }

    if (TOOL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      buckets.tools += 1;
      return;
    }

    buckets.tools += 1;
  }

  async getDashboardSummary(userId) {
    const [totalInterviews, totalResumes, evaluations, interviewScores, resumeScoreAgg] = await Promise.all([
      Interview.countDocuments({ user: userId }),
      Resume.countDocuments({ user: userId }),
      Evaluation.find({ user: userId }).select('overallScore').lean(),
      Interview.find({ user: userId, status: 'evaluated' }).select('evaluationReport').lean(),
      Resume.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            averageAtsScore: { $avg: '$skillScore' },
          },
        },
      ]),
    ]);

    const scores = [];

    evaluations.forEach((evaluation) => {
      const normalized = this._normalizeScore(evaluation.overallScore);
      if (normalized !== null) {
        scores.push(normalized);
      }
    });

    if (!scores.length) {
      interviewScores.forEach((interview) => {
        const normalized = this._normalizeScore(this._extractOverallScoreFromInterview(interview));
        if (normalized !== null) {
          scores.push(normalized);
        }
      });
    }

    const averageScore = scores.length
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : 0;
    const bestScore = scores.length ? Math.round(Math.max(...scores)) : 0;
    const averageAtsScore = resumeScoreAgg[0]?.averageAtsScore
      ? Math.round(resumeScoreAgg[0].averageAtsScore)
      : 0;

    return {
      totalInterviews,
      averageScore,
      bestScore,
      totalResumes,
      averageAtsScore,
    };
  }

  async getPerformanceOverTime(userId) {
    const evaluations = await Evaluation.find({ user: userId })
      .select('overallScore createdAt')
      .sort({ createdAt: 1 })
      .lean();

    let source = evaluations.map((item) => ({
      date: item.createdAt,
      score: this._normalizeScore(item.overallScore),
    })).filter((item) => item.score !== null);

    if (!source.length) {
      const interviews = await Interview.find({ user: userId, status: 'evaluated' })
        .select('createdAt evaluationReport')
        .sort({ createdAt: 1 })
        .lean();

      source = interviews
        .map((interview) => ({
          date: interview.createdAt,
          score: this._normalizeScore(this._extractOverallScoreFromInterview(interview)),
        }))
        .filter((item) => item.score !== null);
    }

    const grouped = source.reduce((acc, item) => {
      const dateKey = new Date(item.date).toISOString().slice(0, 10);
      if (!acc[dateKey]) {
        acc[dateKey] = { total: 0, count: 0 };
      }
      acc[dateKey].total += item.score;
      acc[dateKey].count += 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, entry]) => ({
        date,
        score: Math.round(entry.total / entry.count),
      }));
  }

  async getCategoryScores(userId) {
    const categoryBuckets = {
      technical: [],
      communication: [],
      problemSolving: [],
      confidence: [],
    };

    const evaluations = await Evaluation.find({ user: userId })
      .select('categoryScores')
      .lean();

    evaluations.forEach((evaluation) => {
      Object.keys(categoryBuckets).forEach((key) => {
        const score = this._extractCategoryScore(evaluation.categoryScores, key);
        const normalized = this._normalizeScore(score);
        if (normalized !== null) {
          categoryBuckets[key].push(normalized);
        }
      });
    });

    if (!evaluations.length) {
      const interviews = await Interview.find({ user: userId, status: 'evaluated' })
        .select('evaluationReport')
        .lean();

      interviews.forEach((interview) => {
        const categoryScores = interview?.evaluationReport?.categoryScores || {};
        Object.keys(categoryBuckets).forEach((key) => {
          const score = this._extractCategoryScore(categoryScores, key);
          const normalized = this._normalizeScore(score);
          if (normalized !== null) {
            categoryBuckets[key].push(normalized);
          }
        });
      });
    }

    return {
      technical: categoryBuckets.technical.length
        ? Math.round(categoryBuckets.technical.reduce((sum, value) => sum + value, 0) / categoryBuckets.technical.length)
        : 0,
      communication: categoryBuckets.communication.length
        ? Math.round(categoryBuckets.communication.reduce((sum, value) => sum + value, 0) / categoryBuckets.communication.length)
        : 0,
      problemSolving: categoryBuckets.problemSolving.length
        ? Math.round(categoryBuckets.problemSolving.reduce((sum, value) => sum + value, 0) / categoryBuckets.problemSolving.length)
        : 0,
      confidence: categoryBuckets.confidence.length
        ? Math.round(categoryBuckets.confidence.reduce((sum, value) => sum + value, 0) / categoryBuckets.confidence.length)
        : 0,
    };
  }

  async getSkillDistribution(userId) {
    const buckets = {
      frontend: 0,
      backend: 0,
      tools: 0,
    };

    const [resumes, interviews, interviewIds] = await Promise.all([
      Resume.find({ user: userId }).select('skills').lean(),
      Interview.find({ user: userId }).select('jobRole').lean(),
      Interview.find({ user: userId }).distinct('_id'),
    ]);

    const questions = interviewIds.length
      ? await Question.find({
          interview: { $in: interviewIds },
        })
          .select('category questionText')
          .lean()
      : [];

    resumes.forEach((resume) => {
      (resume.skills || []).forEach((skill) => this._bucketSkill(skill, buckets));
    });

    interviews.forEach((interview) => {
      this._bucketSkill(interview.jobRole, buckets);
    });

    questions.forEach((question) => {
      this._bucketSkill(question.category, buckets);
      this._bucketSkill(question.questionText, buckets);
    });

    return buckets;
  }

  async getSmartInsights(userId) {
  const interviewCount = await Interview.countDocuments({
    user: userId,
    status: "evaluated",
  });

  if (interviewCount === 0) {
    return {
      roleReadiness: 0,
      weakAreas: [],
      suggestions: [],
    };
  }

  const categoryScores = await this.getCategoryScores(userId);

  const roleReadiness = Math.round(
    (
      categoryScores.technical +
      categoryScores.communication +
      categoryScores.problemSolving +
      categoryScores.confidence
    ) / 4
  );

  const weakAreas = [];

  if (categoryScores.technical < 60)
    weakAreas.push(`Technical Knowledge (${categoryScores.technical}%)`);

  if (categoryScores.communication < 60)
    weakAreas.push(`Communication (${categoryScores.communication}%)`);

  if (categoryScores.problemSolving < 60)
    weakAreas.push(`Problem Solving (${categoryScores.problemSolving}%)`);

  if (categoryScores.confidence < 60)
    weakAreas.push(`Confidence (${categoryScores.confidence}%)`);

  const suggestions = [];

  if (categoryScores.technical < 60) {
    suggestions.push(
      "Strengthen core technical concepts before the next interview."
    );
  }

  if (categoryScores.communication < 60) {
    suggestions.push(
      "Practice answering with clear and structured explanations."
    );
  }

  if (categoryScores.problemSolving < 60) {
    suggestions.push(
      "Solve more coding and scenario-based interview questions."
    );
  }

  if (categoryScores.confidence < 60) {
    suggestions.push(
      "Practice mock interviews to improve confidence."
    );
  }

  return {
    roleReadiness,
    weakAreas,
    suggestions,
  };
}

    
  async getUserProgress(userId) {
    // Get all interviews
    const totalInterviews = await Interview.countDocuments({ user: userId });
    const completedInterviews = await Interview.countDocuments({
      user: userId,
      status: { $in: ['completed', 'evaluated'] },
    });
    const evaluatedInterviews = await Interview.countDocuments({
      user: userId,
      status: 'evaluated',
    });

    // Get all evaluations
    const evaluations = await Evaluation.find({ user: userId });

    // Calculate average scores
    let totalOverallScore = 0;
    let totalTechnicalScore = 0;
    let totalCommunicationScore = 0;
    let totalProblemSolvingScore = 0;
    let totalConfidenceScore = 0;

    evaluations.forEach((evaluation) => {
      totalOverallScore += evaluation.overallScore;
      totalTechnicalScore += evaluation.categoryScores.technical || 0;
      totalCommunicationScore += evaluation.categoryScores.communication || 0;
      totalProblemSolvingScore += evaluation.categoryScores.problemSolving || 0;
      totalConfidenceScore += evaluation.categoryScores.confidence || 0;
    });

    const evaluationCount = evaluations.length || 1;

    const averageScores = {
      overall: Math.round(totalOverallScore / evaluationCount),
      technical: Math.round(totalTechnicalScore / evaluationCount),
      communication: Math.round(totalCommunicationScore / evaluationCount),
      problemSolving: Math.round(totalProblemSolvingScore / evaluationCount),
      confidence: Math.round(totalConfidenceScore / evaluationCount),
    };

    // Get recent interviews
    const recentInterviews = await Interview.find({ user: userId })
      .populate('resume', 'filename')
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate improvement trend (last 5 evaluations)
    const recentEvaluations = await Evaluation.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const improvementTrend =
      recentEvaluations.length > 1
        ? recentEvaluations[0].overallScore -
          recentEvaluations[recentEvaluations.length - 1].overallScore
        : 0;

    const oldestScore = recentEvaluations[recentEvaluations.length - 1]?.overallScore || 0;
    const improvementPercent = oldestScore > 0
      ? Math.round((improvementTrend / oldestScore) * 100)
      : 0;

    const categoryScores = [
      { key: 'technical', value: averageScores.technical },
      { key: 'communication', value: averageScores.communication },
      { key: 'problemSolving', value: averageScores.problemSolving },
      { key: 'confidence', value: averageScores.confidence },
    ];

    const weakSkills = categoryScores
      .sort((a, b) => a.value - b.value)
      .slice(0, 2)
      .map((score) => score.key);

    return {
      statistics: {
        totalInterviews,
        completedInterviews,
        evaluatedInterviews,
      },
      averageScores,
      improvementTrend,
      improvementPercent,
      weakSkills,
      recentInterviews: recentInterviews.map((interview) => ({
        id: interview._id,
        jobRole: interview.jobRole,
        experienceLevel: interview.experienceLevel,
        status: interview.status,
        createdAt: interview.createdAt,
      })),
    };
  }

  async getDetailedReport(userId, query) {
    const { startDate, endDate, jobRole, experienceLevel } = query;

    // Build filter
    const filter = { user: userId };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (jobRole) filter.jobRole = jobRole;
    if (experienceLevel) filter.experienceLevel = experienceLevel;

    // Get interviews
    const interviews = await Interview.find(filter)
      .populate('resume', 'filename skills')
      .sort({ createdAt: -1 });

    // Get evaluations for these interviews
    const interviewIds = interviews.map((interview) => interview._id);
    const evaluations = await Evaluation.find({
      interview: { $in: interviewIds },
    }).populate('interview', 'jobRole experienceLevel');

    // Aggregate statistics by job role
    const statsByJobRole = {};
    evaluations.forEach((evaluation) => {
      const role = evaluation.interview.jobRole;
      if (!statsByJobRole[role]) {
        statsByJobRole[role] = {
          count: 0,
          totalScore: 0,
          averageScore: 0,
        };
      }
      statsByJobRole[role].count++;
      statsByJobRole[role].totalScore += evaluation.overallScore;
    });

    // Calculate average scores
    Object.keys(statsByJobRole).forEach((role) => {
      statsByJobRole[role].averageScore = Math.round(
        statsByJobRole[role].totalScore / statsByJobRole[role].count
      );
    });

    // Score distribution
    const scoreDistribution = {
      excellent: 0, // 80-100
      good: 0, // 60-79
      average: 0, // 40-59
      needsImprovement: 0, // 0-39
    };

    evaluations.forEach((evaluation) => {
      const score = evaluation.overallScore;
      if (score >= 80) scoreDistribution.excellent++;
      else if (score >= 60) scoreDistribution.good++;
      else if (score >= 40) scoreDistribution.average++;
      else scoreDistribution.needsImprovement++;
    });

    return {
      totalInterviews: interviews.length,
      totalEvaluations: evaluations.length,
      statsByJobRole,
      scoreDistribution,
      interviews: interviews.map((interview) => ({
        id: interview._id,
        jobRole: interview.jobRole,
        experienceLevel: interview.experienceLevel,
        status: interview.status,
        createdAt: interview.createdAt,
        completedAt: interview.completedAt,
      })),
    };
  }

  async getScoreTrend(userId) {
    const evaluations = await Evaluation.find({ user: userId })
      .populate('interview', 'createdAt jobRole')
      .sort({ createdAt: 1 });

    const trend = evaluations.map((evaluation) => ({
      date: evaluation.createdAt,
      score: evaluation.overallScore,
      jobRole: evaluation.interview.jobRole,
      technical: evaluation.categoryScores.technical,
      communication: evaluation.categoryScores.communication,
      problemSolving: evaluation.categoryScores.problemSolving,
      confidence: evaluation.categoryScores.confidence,
    }));

    return trend;
  }

  async getAggregatedTrend(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const pipeline = [
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          averageScore: { $avg: '$overallScore' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id',
          averageScore: { $round: ['$averageScore', 2] },
          count: 1,
        },
      },
    ];

    return Evaluation.aggregate(pipeline);
  }

  async getHeatmap(userId) {
    const interviews = await Interview.find({ user: userId, status: 'evaluated' })
      .select('jobRole evaluationReport')
      .lean();

    const buckets = {
      technical: [],
      communication: [],
      problemSolving: [],
      confidence: [],
    };

    interviews.forEach((interview) => {
      const categoryScores = interview?.evaluationReport?.categoryScores || {};
      Object.keys(buckets).forEach((key) => {
        const score = this._normalizeScore(this._extractCategoryScore(categoryScores, key));
        if (score !== null) {
          buckets[key].push(score);
        }
      });
    });

    return Object.entries(buckets).map(([topic, values]) => {
      const average = values.length
        ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : 0;

      let intensity = 'high';
      if (average < 40) {
        intensity = 'critical';
      } else if (average < 60) {
        intensity = 'medium';
      }

      return {
        topic,
        score: average,
        intensity,
      };
    });
  }

  async getProgressTrends(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const trend = await Evaluation.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
          },
          averageScore: { $avg: '$overallScore' },
          technical: { $avg: '$categoryScores.technical' },
          communication: { $avg: '$categoryScores.communication' },
          problemSolving: { $avg: '$categoryScores.problemSolving' },
          confidence: { $avg: '$categoryScores.confidence' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      {
        $project: {
          _id: 0,
          label: {
            $concat: [
              { $toString: '$_id.year' },
              '-W',
              { $toString: '$_id.week' },
            ],
          },
          sessions: 1,
          averageScore: { $round: ['$averageScore', 2] },
          technical: { $round: ['$technical', 2] },
          communication: { $round: ['$communication', 2] },
          problemSolving: { $round: ['$problemSolving', 2] },
          confidence: { $round: ['$confidence', 2] },
        },
      },
    ]);

    return trend;
  }
}

export default new ReportService();
