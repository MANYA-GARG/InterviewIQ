/**
 * Development Test Controller
 * 
 * ⚠️ DEVELOPMENT ONLY - Do NOT use in production
 * 
 * Provides API endpoints for testing the interview evaluation flow.
 * These endpoints should ONLY be available when NODE_ENV !== 'production'
 */

import { runInterviewTest, cleanupTestData, MOCK_DATA } from '../utils/testInterviewFlow.js';
import AppError from '../utils/AppError.js';

// Middleware: Only allow in development
const devOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    throw new AppError('Test endpoints are not available outside development', 403);
  }

  // Optional secret protection: if TEST_SECRET is set, require it
  const secret = process.env.TEST_SECRET;
  if (secret) {
    const supplied = req.headers['x-test-secret'] || req.query.test_secret || req.body?.test_secret;
    if (!supplied || supplied !== secret) {
      throw new AppError('Invalid or missing TEST_SECRET for test endpoints', 403);
    }
  }

  next();
};

/**
 * GET /api/test/health
 * Check if test endpoints are available
 */
export const testHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoints available',
    environment: process.env.NODE_ENV,
    mockData: {
      interviewId: MOCK_DATA.interviewId.toString(),
      userId: MOCK_DATA.userId.toString(),
      questionsCount: MOCK_DATA.questions.length,
      answersCount: MOCK_DATA.answers.length
    }
  });
};

/**
 * POST /api/test/run-flow
 * Run complete interview evaluation flow test
 */
export const runFlowTest = async (req, res) => {
  try {
    console.log('\n[TEST] Starting interview evaluation via API...');

    const result = await runInterviewTest();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Test failed',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test completed successfully',
      data: result
    });
  } catch (error) {
    console.error('[TEST] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Test execution failed',
      error: error.message
    });
  }
};

/**
 * POST /api/test/cleanup
 * Clean up test data
 */
export const cleanupTest = async (req, res) => {
  try {
    console.log('\n[TEST] Cleaning up test data via API...');

    const result = await cleanupTestData();

    res.status(200).json({
      success: true,
      message: 'Cleanup completed',
      data: result
    });
  } catch (error) {
    console.error('[TEST] Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
};

/**
 * POST /api/test/full
 * Run test + cleanup
 */
export const runFullTest = async (req, res) => {
  try {
    console.log('\n[TEST] Starting full test (test + cleanup)...');

    // Run test
    const testResult = await runInterviewTest();

    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Test failed',
        error: testResult.error
      });
    }

    // Wait a bit
    await new Promise(r => setTimeout(r, 1000));

    // Cleanup
    const cleanupResult = await cleanupTestData();

    res.status(200).json({
      success: true,
      message: 'Full test completed',
      data: {
        test: testResult,
        cleanup: cleanupResult
      }
    });
  } catch (error) {
    console.error('[TEST] Full test error:', error);
    res.status(500).json({
      success: false,
      message: 'Full test failed',
      error: error.message
    });
  }
};

/**
 * GET /api/test/mock-data
 * Get mock data structure
 */
export const getMockData = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mock data structure',
    data: {
      interview: {
        id: MOCK_DATA.interviewId.toString(),
        userId: MOCK_DATA.userId.toString(),
        jobRole: 'MERN Stack Developer',
        experienceLevel: 'intermediate',
        questionsCount: MOCK_DATA.questions.length
      },
      questions: MOCK_DATA.questions.map((q, i) => ({
        number: q.number,
        text: q.text.substring(0, 50) + '...',
        category: q.category,
        difficulty: q.difficulty
      })),
      answers: MOCK_DATA.answers.map((a, i) => ({
        questionIndex: a.questionIndex,
        status: a.status,
        textLength: a.text.length,
        timeTaken: a.timeTaken
      }))
    }
  });
};

export default {
  devOnly,
  testHealth,
  runFlowTest,
  cleanupTest,
  runFullTest,
  getMockData
};
