#!/usr/bin/env tsx
/**
 * Visual Demo: AI-Powered Test Automation Framework
 *
 * This demonstrates the core concepts without requiring Docker or full backend
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message: string, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function header(title: string) {
  console.log('\n' + '═'.repeat(70));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('═'.repeat(70) + '\n');
}

function box(title: string, content: string[], color = colors.white) {
  const width = 68;
  console.log(`${color}┌${'─'.repeat(width)}┐${colors.reset}`);
  log(`│ ${title.padEnd(width - 1)}│`, color);
  console.log(`${color}├${'─'.repeat(width)}┤${colors.reset}`);
  content.forEach(line => {
    log(`│ ${line.padEnd(width - 1)}│`, color);
  });
  console.log(`${color}└${'─'.repeat(width)}┘${colors.reset}\n`);
}

async function demo() {
  console.clear();

  header('🤖 AI-POWERED TEST AUTOMATION FRAMEWORK - LIVE DEMO');

  log('Welcome! This demo shows how the framework:', colors.bright);
  log('  1. Self-heals broken locators automatically');
  log('  2. Uses AI to triage failures');
  log('  3. Requires ZERO manual test maintenance\n');

  await sleep(2000);

  // ===== SCENARIO =====
  header('📱 SCENARIO: App Update Breaks Tests');

  log('Yesterday: App v1.0 - All tests passing ✅', colors.green);
  log('Today:     App v2.0 - Developer renamed element IDs ❌', colors.red);
  log('\n           Traditional testing: Tests fail, engineer fixes for 30 mins');
  log('           This framework:      Tests heal automatically in seconds\n', colors.cyan);

  await sleep(3000);

  // ===== TEST EXECUTION =====
  header('🧪 TEST EXECUTION: Login Flow');

  box('Test: Login with valid credentials', [
    'File: test-suites/mobile/android/tests/login.test.ts',
    'Platform: Android',
    'Status: Running...'
  ], colors.blue);

  await sleep(1000);

  log('Step 1: Launch app...                              ✅', colors.green);
  await sleep(500);
  log('Step 2: Navigate to login screen...                ✅', colors.green);
  await sleep(500);
  log('Step 3: Find username field...                     ⏳', colors.yellow);
  await sleep(1000);

  // ===== LOCATOR FAILURE =====
  header('❌ LOCATOR FAILURE DETECTED');

  box('Primary Locator Failed', [
    'Locator Type: id',
    'Locator Value: com.example.app:id/username_input',
    '',
    'Error: NoSuchElementError',
    'Message: Element not found after 10000ms timeout',
    '',
    '📸 Screenshot captured',
    '📋 Stack trace collected',
    '🔍 Context preserved'
  ], colors.red);

  await sleep(2000);

  // ===== SELF-HEALING STARTS =====
  header('🔧 SELF-HEALING ACTIVATED');

  log('Fallback Strategy: Trying alternative locators...\n', colors.cyan);

  await sleep(1000);

  log('Fallback #1: xpath="//EditText[@content-desc=\'Username\']"', colors.yellow);
  await sleep(1500);
  log('            ✅ SUCCESS! Element found\n', colors.green);

  await sleep(1000);

  box('Healing Report Sent to Backend', [
    'Old Locator: id="username_input" (FAILED)',
    'New Locator: xpath="//EditText[@content-desc=\'Username\']" (WORKED)',
    'Strategy: fallback_chain',
    'Timestamp: ' + new Date().toISOString()
  ], colors.green);

  await sleep(2000);

  // ===== AI ANALYSIS =====
  header('🤖 AI ANALYSIS IN PROGRESS');

  log('Sending to Claude API...', colors.cyan);
  log('  • Screenshot (base64)', colors.white);
  log('  • Error context', colors.white);
  log('  • Stack trace', colors.white);
  log('  • Locator definitions\n', colors.white);

  await sleep(2000);

  log('Analyzing...', colors.yellow);
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  for (let i = 0; i < 15; i++) {
    process.stdout.write(`\r${spinner[i % spinner.length]} Claude is analyzing the failure...`);
    await sleep(200);
  }
  process.stdout.write('\r✅ Analysis complete!                              \n\n');

  await sleep(1000);

  // ===== AI RESULTS =====
  box('🎯 AI Analysis Results', [
    'Category: FLAKY_LOCATOR',
    'Confidence: 92%',
    'Bug Probability: 8%',
    '',
    'Reasoning:',
    '  "The screenshot shows a functional login screen with',
    '   the username input field clearly visible. The error',
    '   indicates the element ID changed, but the element',
    '   itself exists and is functional. This is a locator',
    '   issue, not an application bug."',
    '',
    'Evidence:',
    '  • UI element is visible and functional',
    '  • App shows no crash or error dialogs',
    '  • Fallback locator successfully found element',
    '',
    'Suggested Actions:',
    '  • Update primary locator to successful one',
    '  • Use accessibility IDs for better stability',
    '  • Add current ID as fallback for rollback scenarios'
  ], colors.cyan);

  await sleep(3000);

  // ===== CONFIDENCE CALCULATION =====
  header('📊 HEALING CONFIDENCE CALCULATION');

  log('Calculating confidence for auto-apply decision...\n', colors.yellow);

  await sleep(1000);

  const factors = [
    { name: 'Base confidence', value: 50 },
    { name: 'Strategy bonus (fallback_chain)', value: 25 },
    { name: 'Locator type bonus (xpath)', value: 5 },
    { name: 'No previous failures', value: 0 },
    { name: 'Element stability (85%)', value: 9 }
  ];

  let total = 0;
  factors.forEach(factor => {
    total += factor.value;
    log(`  ${factor.name.padEnd(35)} +${factor.value.toString().padStart(3)}% = ${total}%`, colors.white);
    });

  await sleep(1500);

  const finalConfidence = total;
  const threshold = 85;

  log(`\n  ${'─'.repeat(40)}`, colors.white);
  log(`  Final Confidence: ${finalConfidence}%`, colors.bright + colors.green);
  log(`  Auto-Apply Threshold: ${threshold}%`, colors.white);
  log(`  Decision: ${finalConfidence >= threshold ? 'AUTO-APPLY ✅' : 'MANUAL REVIEW ⚠️'}`,
      finalConfidence >= threshold ? colors.green : colors.yellow);

  await sleep(2000);

  // ===== AUTO-APPLY =====
  if (finalConfidence >= threshold) {
    header('✅ AUTO-APPLYING HEALING');

    log('Updating locators.json...', colors.cyan);
    await sleep(1000);

    console.log('\n  BEFORE:');
    box('loginPage.username', [
      'primary: {',
      '  type: "id",',
      '  value: "username_input"  ← BROKEN',
      '}',
      'fallbacks: [',
      '  { type: "xpath", value: "//EditText[@content-desc=\'Username\']" }',
      ']'
    ], colors.red);

    await sleep(1500);

    console.log('  AFTER:');
    box('loginPage.username', [
      'primary: {',
      '  type: "xpath",',
      '  value: "//EditText[@content-desc=\'Username\']"  ← NOW PRIMARY',
      '}',
      'fallbacks: [',
      '  { type: "id", value: "username_input" }  ← Moved to fallback',
      ']',
      '',
      'metadata: {',
      '  healingHistory: [',
      '    {',
      '      date: "' + new Date().toISOString().split('T')[0] + '",',
      '      reason: "Primary failed, fallback succeeded",',
      '      confidence: 89,',
      '      autoApplied: true',
      '    }',
      '  ]',
      '}'
    ], colors.green);

    await sleep(2000);

    log('✅ Locators.json updated successfully!\n', colors.green);

    await sleep(1000);

    // ===== TEST RETRY =====
    header('🔄 RETRYING TEST WITH HEALED LOCATOR');

    log('Resuming test execution...\n', colors.cyan);
    await sleep(1000);

    log('Step 3: Find username field...                     ✅', colors.green);
    await sleep(500);
    log('Step 4: Enter username...                          ✅', colors.green);
    await sleep(500);
    log('Step 5: Enter password...                          ✅', colors.green);
    await sleep(500);
    log('Step 6: Click login button...                      ✅', colors.green);
    await sleep(500);
    log('Step 7: Verify login successful...                 ✅', colors.green);
    await sleep(1000);

    log('\n✅ TEST PASSED!\n', colors.bright + colors.green);
  }

  await sleep(2000);

  // ===== SUMMARY =====
  header('📈 HEALING SUMMARY');

  box('Impact Analysis', [
    '⏱️  BEFORE HEALING:',
    '   Test Status: FAILED ❌',
    '   Primary Locator: Broken',
    '   Manual Fix Required: ~30 minutes',
    '   Engineer Intervention: Required',
    '',
    '⚡ AFTER HEALING:',
    '   Test Status: PASSED ✅',
    '   Primary Locator: Automatically fixed',
    '   Healing Time: 2.3 seconds',
    '   Engineer Intervention: NONE',
    '',
    '💰 VALUE DELIVERED:',
    '   Time Saved: 30 minutes',
    '   Tests Fixed: 1 (and all future runs)',
    '   Manual Work: 0%',
    '   Confidence: 89% (high)',
    '   Auto-Applied: Yes'
  ], colors.green);

  await sleep(2000);

  // ===== DASHBOARD =====
  header('📊 DASHBOARD UPDATES');

  log('Real-time updates sent to dashboard at http://localhost:5173\n', colors.cyan);

  box('Dashboard - Self-Healing Tab', [
    '🔧 Recent Healings:',
    '',
    '✅ loginPage.username',
    '   Confidence: 89% | Auto-applied | 2 seconds ago',
    '   Old: id="username_input"',
    '   New: xpath="//EditText[@content-desc=\'Username\']"',
    '',
    '📊 Statistics:',
    '   Total Healings: 47',
    '   Auto-Applied: 43 (91%)',
    '   Success Rate: 96%',
    '   Time Saved: 23.5 hours'
  ], colors.cyan);

  await sleep(3000);

  // ===== CONCLUSION =====
  header('✨ DEMO COMPLETE!');

  log('Key Takeaways:', colors.bright);
  log('  ✅ Tests self-heal automatically', colors.green);
  log('  ✅ AI triages failures intelligently', colors.green);
  log('  ✅ Zero manual maintenance required', colors.green);
  log('  ✅ Engineers focus on writing tests, not fixing them', colors.green);
  log('  ✅ High-confidence changes auto-apply', colors.green);
  log('  ✅ Low-confidence changes queued for review\n', colors.green);

  log('Ready to use the framework?', colors.cyan);
  log('  1. Add your Claude API key to backend/.env', colors.white);
  log('  2. Run: npm run docker:up', colors.white);
  log('  3. Open: http://localhost:5173', colors.white);
  log('  4. Write tests and watch them self-heal!\n', colors.white);

  console.log('═'.repeat(70) + '\n');
}

// Run the demo
demo().catch(console.error);
