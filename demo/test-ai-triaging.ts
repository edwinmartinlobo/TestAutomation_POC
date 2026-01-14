/**
 * Demo: AI-Powered Failure Triaging
 *
 * This demonstrates how the framework analyzes test failures using Claude AI
 * WITHOUT needing a full Docker setup or real mobile app.
 */

import { FailureAnalyzerService } from '../backend/src/services/ai-agent/FailureAnalyzer.service';
import { FailureContext, FailureCategory } from '../backend/src/types/failure.types';

// Mock failure context (what would be captured from a real test)
const mockFailureContext: FailureContext = {
  testName: 'Login Test - Username Field',
  platform: 'android',
  errorMessage: 'NoSuchElementError: An element could not be located on the page using the given search parameters',
  stackTrace: `Error: element ("id=com.example.app:id/username_input") still not existing after 10000ms
    at LoginPage.enterUsername (/test-suites/mobile/android/page-objects/LoginPage.ts:15:11)
    at Context.<anonymous> (/test-suites/mobile/android/tests/login.test.ts:23:5)`,
  locatorUsed: 'id=com.example.app:id/username_input',
  // In a real scenario, this would be a base64 screenshot
  screenshot: undefined,
  logs: [
    'INFO: Starting test execution',
    'INFO: Navigating to login page',
    'ERROR: Element not found after timeout',
    'ERROR: Screenshot captured'
  ]
};

async function demoAITriaging() {
  console.log('🤖 AI-Powered Failure Triaging Demo\n');
  console.log('═'.repeat(60));

  console.log('\n📋 Test Failure Context:');
  console.log('  Test:', mockFailureContext.testName);
  console.log('  Platform:', mockFailureContext.platform);
  console.log('  Error:', mockFailureContext.errorMessage.substring(0, 80) + '...');
  console.log('  Locator:', mockFailureContext.locatorUsed);

  console.log('\n🔍 Analyzing with AI...\n');

  try {
    const analyzer = new FailureAnalyzerService();

    // This will use the fallback rule-based analysis since we don't have Claude API key
    const analysis = await analyzer.analyzeFailure(mockFailureContext);

    console.log('✅ Analysis Complete!\n');
    console.log('═'.repeat(60));
    console.log('\n📊 AI Analysis Results:\n');

    // Category
    console.log('🏷️  Category:', analysis.category.toUpperCase().replace(/_/g, ' '));

    // Confidence
    const confidenceBar = '█'.repeat(Math.floor(analysis.confidence / 5));
    const emptyBar = '░'.repeat(20 - Math.floor(analysis.confidence / 5));
    console.log(`📈 Confidence: ${analysis.confidence}% [${confidenceBar}${emptyBar}]`);

    // Bug Probability
    const bugBar = '█'.repeat(Math.floor(analysis.bugProbability / 5));
    const bugEmptyBar = '░'.repeat(20 - Math.floor(analysis.bugProbability / 5));
    console.log(`🐛 Bug Probability: ${analysis.bugProbability}% [${bugBar}${bugEmptyBar}]`);

    // Reasoning
    console.log('\n💭 AI Reasoning:');
    console.log('  ', analysis.reasoning);

    // Evidence Points
    if (analysis.evidencePoints.length > 0) {
      console.log('\n🔬 Evidence Points:');
      analysis.evidencePoints.forEach((point, i) => {
        console.log(`   ${i + 1}. ${point}`);
      });
    }

    // Suggested Actions
    if (analysis.suggestedActions.length > 0) {
      console.log('\n💡 Suggested Actions:');
      analysis.suggestedActions.forEach((action, i) => {
        console.log(`   ${i + 1}. ${action}`);
      });
    }

    // Root Cause
    if (analysis.rootCause) {
      console.log('\n🎯 Root Cause:', analysis.rootCause);
    }

    console.log('\n═'.repeat(60));

    // Decision making
    console.log('\n🤔 Decision Making:\n');

    if (analysis.category === FailureCategory.FLAKY_LOCATOR) {
      console.log('✅ This is a FLAKY LOCATOR - Triggering self-healing...');
      console.log('   → Will try fallback locators');
      console.log('   → Will ask Claude AI for better locator suggestions');
      console.log('   → Will auto-apply if confidence > 85%');
    } else if (analysis.category === FailureCategory.ACTUAL_BUG) {
      console.log('🐛 This is likely an ACTUAL BUG - Creating bug report...');
      console.log('   → High bug probability:', analysis.bugProbability + '%');
      console.log('   → Notifying developers');
      console.log('   → No self-healing needed');
    } else if (analysis.category === FailureCategory.TIMING_ISSUE) {
      console.log('⏱️  This is a TIMING ISSUE - Adjusting wait strategies...');
      console.log('   → Increasing explicit waits');
      console.log('   → Adding retry logic');
    } else if (analysis.category === FailureCategory.ENVIRONMENTAL_ISSUE) {
      console.log('🏗️  This is an ENVIRONMENTAL ISSUE - Check infrastructure...');
      console.log('   → Check test environment');
      console.log('   → Verify network connectivity');
      console.log('   → Review infrastructure logs');
    }

    console.log('\n✨ Demo Complete!\n');

  } catch (error: any) {
    console.error('\n❌ Error during analysis:', error.message);
    console.log('\n💡 Note: For full AI capabilities, set CLAUDE_API_KEY in backend/.env');
    console.log('   Without it, the framework uses rule-based fallback analysis.');
  }
}

// Run the demo
console.clear();
demoAITriaging().catch(console.error);
