import reportService from '../services/report.service.js';

const sendError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

export const getUserProgress = async (req, res) => {
  try {
    const progress = await reportService.getUserProgress(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Progress retrieved successfully',
      data: { progress }
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve progress');
  }
};

export const getDetailedReport = async (req, res) => {
  try {
    const report = await reportService.getDetailedReport(req.user._id, req.query);
    res.status(200).json({
      success: true,
      message: 'Report retrieved successfully',
      data: { report }
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve report');
  }
};

export const getScoreTrend = async (req, res) => {
  try {
    const trend = await reportService.getScoreTrend(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Score trend retrieved successfully',
      data: { trend }
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve score trend');
  }
};

export const getAggregatedTrend = async (req, res) => {
  try {
    const trend = await reportService.getAggregatedTrend(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Aggregated trend retrieved successfully',
      data: { trend }
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve aggregated trend');
  }
};

export const getPerformanceOverTime = async (req, res) => {
  try {
    const performance = await reportService.getPerformanceOverTime(req.user._id);
    res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve performance data');
  }
};

export const getCategoryScores = async (req, res) => {
  try {
    const categoryScores = await reportService.getCategoryScores(req.user._id);
    res.status(200).json({
      success: true,
      data: categoryScores,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve category scores');
  }
};

export const getSkillDistribution = async (req, res) => {
  try {
    const skills = await reportService.getSkillDistribution(req.user._id);
    res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve skill distribution');
  }
};

export const getSmartInsights = async (req, res) => {
  try {
    const insights = await reportService.getSmartInsights(req.user._id);
    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve smart insights');
  }
};

export const getHeatmap = async (req, res) => {
  try {
    const heatmap = await reportService.getHeatmap(req.user._id);
    res.status(200).json({
      success: true,
      data: heatmap,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve heatmap data');
  }
};

export const getProgressTrends = async (req, res) => {
  try {
    const trends = await reportService.getProgressTrends(req.user._id);
    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve progress trends');
  }
};
