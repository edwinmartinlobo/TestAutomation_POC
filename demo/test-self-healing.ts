/**
 * Demo: Self-Healing Locator System
 *
 * This demonstrates how the framework automatically heals broken locators
 * WITHOUT needing a full Docker setup or real mobile app.
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../backend/.env') });

import { FailureAnalyzerService } from '../backend/src/services/ai-agent/FailureAnalyzer.service';

interface Locator {
  type: string;
  value: string;
}

interface LocatorDefinition {
  primary: Locator;
  fallbacks: Locator[];
  metadata: {
    lastVerified: string;
    healingHistory: any[];
  };
}

// Mock locator definition from locators.json
const usernameLocator: LocatorDefinition = {
  primary: {
    type: 'id',
    value: 'com.example.app:id/username_input'
  },
  fallbacks: [
    {
      type: 'xpath',
      value: '//android.widget.EditText[@content-desc="Username"]'
    },
    {
      type: 'xpath',
      value: '//android.widget.EditText[contains(@text, "Username")]'
    },
    {
      type: 'androidUIAutomator',
      value: 'new UiSelector().className("android.widget.EditText").instance(0)'
    }
  ],
  metadata: {
    lastVerified: '2026-01-13',
    healingHistory: []
  }
};

async function simulateFindElement(locator: Locator): Promise<boolean> {
  // Simulate:
  // - Primary locator fails (app was updated, ID changed)
  // - Fallback #1 succeeds (content-desc still works)
  if (locator.type === 'id' && locator.value.includes('username_input')) {
    return false; // Primary fails
  }
  if (locator.type === 'xpath' && locator.value.includes('content-desc')) {
    return true; // Fallback succeeds!
  }
  return Math.random() > 0.5;
}

async function demoSelfHealing() {
  console.log('🔧 Self-Healing Locator System Demo\n');
  console.log('═'.repeat(60));

  console.log('\n📱 Scenario: App was updated, element ID changed');
  console.log('   Old ID: "username_input"');
  console.log('   New ID: "user_name_field" (developer renamed it)');

  console.log('\n📍 Current Locator Configuration:\n');
  console.log('   PRIMARY:', `${usernameLocator.primary.type}="${usernameLocator.primary.value}"`);
  console.log('   FALLBACKS:');
  usernameLocator.fallbacks.forEach((fallback, i) => {
    console.log(`     ${i + 1}. ${fallback.type}="${fallback.value.substring(0, 60)}..."`);
  });

  console.log('\n🧪 Test Execution Starting...\n');
  console.log('═'.repeat(60));

  // Step 1: Try primary locator
  console.log('\n🔍 Step 1: Trying PRIMARY locator...');
  console.log(`   Locator: ${usernameLocator.primary.type}="${usernameLocator.primary.value}"`);

  await new Promise(resolve => setTimeout(resolve, 500));

  const primarySuccess = await simulateFindElement(usernameLocator.primary);

  if (!primarySuccess) {
    console.log('   ❌ PRIMARY FAILED - Element not found!');
    console.log('   💡 Initiating fallback chain...\n');

    // Step 2: Try fallbacks
    console.log('🔄 Step 2: Trying FALLBACK locators...\n');

    let successfulFallback: Locator | null = null;
    let fallbackIndex = -1;

    for (let i = 0; i < usernameLocator.fallbacks.length; i++) {
      const fallback = usernameLocator.fallbacks[i];

      console.log(`   Fallback #${i + 1}: ${fallback.type}="${fallback.value.substring(0, 50)}..."`);

      await new Promise(resolve => setTimeout(resolve, 500));

      const success = await simulateFindElement(fallback);

      if (success) {
        console.log(`   ✅ SUCCESS! Element found with fallback #${i + 1}`);
        successfulFallback = fallback;
        fallbackIndex = i;
        break;
      } else {
        console.log(`   ❌ Failed`);
      }
    }

    if (successfulFallback) {
      console.log('\n═'.repeat(60));
      console.log('\n🎉 Self-Healing Triggered!\n');

      // Step 3: Calculate confidence
      console.log('📊 Step 3: Calculating healing confidence...\n');

      const analyzer = new FailureAnalyzerService();
      const confidence = analyzer.calculateHealingConfidence({
        strategy: 'fallback_chain',
        locatorType: successfulFallback.type,
        previousFailures: 0,
        elementStability: 0.85
      });

      console.log(`   Strategy: Fallback Chain`);
      console.log(`   Locator Type: ${successfulFallback.type}`);
      console.log(`   Previous Failures: 0`);
      console.log(`   Element Stability: 85%`);
      console.log(`\n   ➜ CALCULATED CONFIDENCE: ${confidence}%`);

      const confidenceBar = '█'.repeat(Math.floor(confidence / 5));
      const emptyBar = '░'.repeat(20 - Math.floor(confidence / 5));
      console.log(`   [${confidenceBar}${emptyBar}] ${confidence}%\n`);

      // Step 4: Decision
      console.log('🤔 Step 4: Auto-Apply Decision...\n');

      const threshold = 85;
      console.log(`   Auto-Apply Threshold: ${threshold}%`);
      console.log(`   Calculated Confidence: ${confidence}%`);

      if (confidence >= threshold) {
        console.log(`\n   ✅ DECISION: AUTO-APPLY (confidence ${confidence}% >= ${threshold}%)`);

        console.log('\n🔨 Step 5: Applying Healing Changes...\n');

        console.log('   📝 Updating locators.json:');
        console.log(`      OLD PRIMARY: ${usernameLocator.primary.type}="${usernameLocator.primary.value}"`);
        console.log(`      NEW PRIMARY: ${successfulFallback.type}="${successfulFallback.value.substring(0, 50)}..."`);
        console.log('      (Old primary moved to fallbacks)');

        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('\n   ✅ locators.json updated successfully!');

        console.log('\n   📊 Creating healing record:');
        console.log('      - Change ID: lc-' + Math.random().toString(36).substr(2, 9));
        console.log('      - Status: auto_applied');
        console.log('      - Confidence:', confidence + '%');
        console.log('      - Applied At:', new Date().toISOString());

        console.log('\n🔄 Step 6: Retrying test with healed locator...\n');

        await new Promise(resolve => setTimeout(resolve, 500));

        const retrySuccess = await simulateFindElement(successfulFallback);

        if (retrySuccess) {
          console.log('   ✅ TEST PASSED! Element found with new locator.');
          console.log('\n═'.repeat(60));
          console.log('\n🎊 Success! Test healed automatically - NO manual intervention needed!\n');

          // Summary
          console.log('📈 Healing Summary:\n');
          console.log('   Before Healing:');
          console.log('   ❌ Test Status: FAILED');
          console.log('   ❌ Primary Locator: Broken');
          console.log('   ⏱️  Manual Fix Time: ~30 minutes');
          console.log('\n   After Healing:');
          console.log('   ✅ Test Status: PASSED');
          console.log('   ✅ Primary Locator: Fixed automatically');
          console.log('   ⚡ Healing Time: <2 seconds');
          console.log('   👤 Engineer Time Saved: 30 minutes');
          console.log('   🤖 Auto-Applied: Yes (high confidence)');

        } else {
          console.log('   ❌ Retry failed (unexpected)');
        }

      } else {
        console.log(`\n   ⚠️  DECISION: QUEUE FOR MANUAL REVIEW (confidence ${confidence}% < ${threshold}%)`);
        console.log('\n   📋 Creating approval request:');
        console.log('      - Status: pending_approval');
        console.log('      - Reason: Low confidence, needs human verification');
        console.log('      - Dashboard: http://localhost:5173/self-healing');
      }

    } else {
      console.log('\n❌ All fallbacks failed!');
      console.log('\n🤖 Next Step: Request AI suggestion from Claude...');
      console.log('   (Would send screenshot to Claude API for analysis)');
    }

  } else {
    console.log('   ✅ Success - Element found with primary locator');
    console.log('   (No healing needed)');
  }

  console.log('\n═'.repeat(60));
  console.log('\n✨ Demo Complete!\n');

  console.log('💡 Key Takeaways:\n');
  console.log('   1. Tests never need manual locator updates');
  console.log('   2. Fallback chain provides instant resilience');
  console.log('   3. High-confidence changes auto-apply automatically');
  console.log('   4. Low-confidence changes queued for human review');
  console.log('   5. All changes tracked with full history\n');
}

// Run the demo
console.clear();
demoSelfHealing().catch(console.error);
