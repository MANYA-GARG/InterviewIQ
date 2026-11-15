#!/usr/bin/env node

/**
 * InterviewIQ Test Runner - Fully Automated
 * 
 * AUTO EXECUTES the complete interview evaluation pipeline
 * 
 * Usage:
 *   npm run test:interview          # Auto-run test
 *   npm run test:interview:full     # Test + auto-cleanup
 *   node testRunner.js test         # Run test only
 *   node testRunner.js full         # Run test + cleanup
 *   node testRunner.js cleanup      # Cleanup only
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { runInterviewTest, cleanupTestData } from './src/utils/testInterviewFlow.js';

dotenv.config();

const command = process.argv[2] || 'test';
let mongoConnection = null;

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewiq';
    
    console.log('🔌 Connecting to database...');
    mongoConnection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Database connected\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function disconnectDB() {
  if (mongoConnection) {
    try {
      await mongoose.disconnect();
    } catch (error) {
      console.error('Warning: Disconnect failed:', error.message);
    }
  }
}

async function main() {
  try {
    // Prevent running in non-development environments
    if (process.env.NODE_ENV !== 'development') {
      console.error('ERROR: testRunner can only be executed in development environment. Aborting.');
      process.exit(1);
    }

    // Connect to database first
    await connectDB();

    switch (command.toLowerCase()) {
      case 'test':
        // Manual trigger only (dev)
        console.log('⚠️ TEST MODE ACTIVE - DEVELOPMENT ONLY');
        console.log('🚀 STARTING MANUAL TEST EXECUTION (development only)\n');
        const testResult = await runInterviewTest();
        
        // Exit with appropriate code
        process.exit(testResult.success ? 0 : 1);
        break;

      case 'full':
        // Manual trigger + cleanup (dev only)
        console.log('⚠️ TEST MODE ACTIVE - DEVELOPMENT ONLY');
        console.log('🚀 STARTING MANUAL TEST EXECUTION (WITH CLEANUP)\n');
        const fullResult = await runInterviewTest();
        
        if (fullResult.success) {
          console.log('🧹 Cleaning up test data...\n');
          await cleanupTestData();
          console.log('✅ Test and cleanup completed\n');
          process.exit(0);
        } else {
          console.log('⚠️  Skipping cleanup due to test failure\n');
          process.exit(1);
        }
        break;

      case 'cleanup':
        // Auto-cleanup only
        console.log('🧹 STARTING CLEANUP\n');
        await cleanupTestData();
        console.log('✅ Cleanup completed\n');
        process.exit(0);
        break;

      case 'help':
        console.log(`
📖 InterviewIQ Test Runner - Automated Testing

COMMANDS:
  test          Run automated interview evaluation test
  full          Run test + auto-cleanup
  cleanup       Clean up test data only
  help          Show this help message

QUICK START:
  npm run test:interview          # Auto-run test
  npm run test:interview:full     # Test + auto-cleanup
  npm run test:interview:cleanup  # Cleanup only

ENVIRONMENT:
  MONGODB_URI   MongoDB connection string (default: localhost:27017)
  NODE_ENV      Set to 'development' for dev mode
        `);
        process.exit(0);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node testRunner.js help" for available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Auto-execute immediately on script run
main();
