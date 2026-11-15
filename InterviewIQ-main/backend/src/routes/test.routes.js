/**
 * Test Routes (Development Only)
 * 
 * ⚠️ These routes are ONLY available in development mode
 * They will be blocked in production via devOnly middleware
 */

import express from 'express';
import testController from '../controllers/test.controller.js';

const router = express.Router();

// Use controller-provided devOnly middleware which handles TEST_SECRET
router.use(testController.devOnly);

/**
 * GET /api/test/health
 * Check if test endpoints are available
 */
router.get('/health', testController.testHealth);

/**
 * GET /api/test/mock-data
 * Get mock data structure
 */
router.get('/mock-data', testController.getMockData);

/**
 * POST /api/test/run-flow
 * Run complete interview evaluation flow test
 */
router.post('/run-flow', testController.runFlowTest);

/**
 * POST /api/test/cleanup
 * Clean up test data from database
 */
router.post('/cleanup', testController.cleanupTest);

/**
 * POST /api/test/full
 * Run test + cleanup in sequence
 */
router.post('/full', testController.runFullTest);

export default router;
