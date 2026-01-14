# Test Automation Framework - Demos

This directory contains standalone demos that showcase the framework's capabilities without requiring a full Docker setup.

## Available Demos

### 1. Visual Demo ⭐ RECOMMENDED
**File:** `visual-demo.ts`

The most comprehensive and visually appealing demo. Shows the complete self-healing flow with:
- Color-coded terminal output
- Step-by-step test execution
- Locator failure detection
- Self-healing activation
- AI analysis with Claude
- Confidence calculation
- Auto-apply decision
- Test retry and success
- Impact summary

**Run:**
```bash
npx tsx visual-demo.ts
```

**Duration:** ~45 seconds
**Requirements:** None (fully standalone)

---

### 2. Self-Healing Demo
**File:** `test-self-healing.ts`

Demonstrates the self-healing locator system using actual backend services:
- Fallback chain pattern
- Confidence calculation algorithm
- FailureAnalyzer service integration
- Locator update simulation

**Run:**
```bash
npm run demo:healing
```

**Duration:** ~15 seconds
**Requirements:** Backend services running (or uses mock data)

---

### 3. AI Triaging Demo
**File:** `test-ai-triaging.ts`

Shows how AI categorizes different types of test failures:
- Claude API integration
- Multiple failure scenarios
- Confidence scoring
- Bug vs Flaky Locator vs Timing vs Environmental issues

**Run:**
```bash
npm run demo:triaging
```

**Duration:** ~20 seconds
**Requirements:** Claude API key in `backend/.env`

---

## What Each Demo Shows

### Visual Demo Output Example:
```
══════════════════════════════════════════════════════════════════════
  🤖 AI-POWERED TEST AUTOMATION FRAMEWORK - LIVE DEMO
══════════════════════════════════════════════════════════════════════

📱 SCENARIO: App Update Breaks Tests
  Yesterday: App v1.0 - All tests passing ✅
  Today:     App v2.0 - Developer renamed element IDs ❌

🧪 TEST EXECUTION: Login Flow
  Step 1: Launch app...                              ✅
  Step 2: Navigate to login screen...                ✅
  Step 3: Find username field...                     ⏳

❌ LOCATOR FAILURE DETECTED
  Locator Type: id
  Locator Value: com.example.app:id/username_input
  Error: NoSuchElementError
  📸 Screenshot captured

🔧 SELF-HEALING ACTIVATED
  Fallback #1: xpath="//EditText[@content-desc='Username']"
  ✅ SUCCESS! Element found

🤖 AI ANALYSIS IN PROGRESS
  Category: FLAKY_LOCATOR
  Confidence: 92%
  Bug Probability: 8%

📊 HEALING CONFIDENCE CALCULATION
  Final Confidence: 89%
  Auto-Apply Threshold: 85%
  Decision: AUTO-APPLY ✅

✅ AUTO-APPLYING HEALING
  locators.json updated successfully!

🔄 RETRYING TEST WITH HEALED LOCATOR
  ✅ TEST PASSED!

📈 HEALING SUMMARY
  Time Saved: 30 minutes
  Manual Work: 0%
  Confidence: 89% (high)
```

---

## Running Multiple Demos

Run all demos in sequence:
```bash
npm run demo:all
```

---

## Demo Flow Explained

### 1. Test Failure Detection
```
Test runs → Locator fails → Screenshot captured → Error logged
```

### 2. Self-Healing Activation
```
Primary fails → Try fallback #1 → Try fallback #2 → Success!
             → Report to backend → Create healing record
```

### 3. AI Analysis
```
Send to Claude API:
  - Screenshot (base64)
  - Error message
  - Stack trace
  - Locator definition

Receive analysis:
  - Category (Bug/Flaky/Timing/Environment)
  - Confidence score (0-100)
  - Reasoning with evidence
  - Suggested actions
```

### 4. Confidence Calculation
```
Base confidence:        50%
+ Strategy bonus:       25%  (fallback_chain)
+ Locator type bonus:    5%  (xpath)
+ Element stability:     9%  (85% stable)
- Previous failures:     0%
= Final confidence:     89%
```

### 5. Auto-Apply Decision
```
IF confidence >= 85%:
    Update locators.json automatically
    Retry test
    Mark as auto_applied
ELSE:
    Queue for manual review
    Show in dashboard
    Wait for approval
```

---

## Real-World Impact

**Traditional Approach (Manual Fix):**
- Test fails
- Engineer notified
- Investigate failure (15 min)
- Update locator (5 min)
- Commit & push (5 min)
- Re-run test (5 min)
- **Total: 30 minutes**

**AI-Powered Framework (Automated):**
- Test fails
- AI analyzes (2 sec)
- Self-healing activates (1 sec)
- Auto-apply decision (<1 sec)
- Test retries (5 sec)
- **Total: ~8 seconds**

**Time Saved:** 29 minutes 52 seconds (99.6% faster)

---

## Next Steps

After running the demos:

1. **Start Full System:**
   ```bash
   cd ..
   npm run docker:up
   ```

2. **Open Dashboard:**
   ```
   http://localhost:5173
   ```

3. **Trigger Real Tests:**
   ```bash
   curl -X POST http://localhost:3000/api/tests/run \
     -H "Content-Type: application/json" \
     -d '{"suite": "mobile", "platform": "android"}'
   ```

4. **View Results:**
   - Dashboard: Test runs, pass rates, failure trends
   - Triage Reports: AI analysis of each failure
   - Self-Healing Queue: Pending approvals
   - Screenshots: Captured failure images

---

## Architecture Overview

The framework consists of:

**Backend Services:**
- `ClaudeClient.service.ts` - Claude API wrapper
- `FailureAnalyzer.service.ts` - AI failure analysis
- `LocatorHealer.service.ts` - Self-healing engine
- `TriageGenerator.service.ts` - Triage report generation

**Frontend Dashboard:**
- Real-time test execution monitoring
- AI triage report viewer
- Self-healing approval queue
- Failure trends and analytics

**Test Infrastructure:**
- `BasePage.ts` - Self-healing element finder
- `locators.json` - Centralized locator definitions with fallbacks
- Page Object Model pattern
- Automatic screenshot capture

---

## Configuration

The framework uses these thresholds (configurable in `backend/.env`):

```env
SELF_HEALING_ENABLED=true
SELF_HEALING_THRESHOLD=85
SELF_HEALING_REQUIRE_APPROVAL=true
SELF_HEALING_MAX_RETRIES=3
```

**Confidence Scoring:**
- **≥85%**: Auto-apply changes
- **<85%**: Queue for manual review

**Healing Strategies:**
1. **Fallback Chain** (25 points) - Try alternative locators
2. **AI Suggested** (20 points) - Ask Claude for better locator
3. **Similarity Match** (15 points) - Find similar elements

---

## Troubleshooting

**Demo not running?**
```bash
# Install dependencies
npm install

# Check Node version (should be 18.17.0+)
node --version

# Run with verbose output
DEBUG=* npx tsx visual-demo.ts
```

**Module not found errors?**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Claude API errors?**
```bash
# Check API key is set
cat ../backend/.env | grep CLAUDE_API_KEY

# Test API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

---

## Feedback & Support

Found an issue or have questions?
- Check `GETTING_STARTED.md` in the root directory
- Review `FLOW_DIAGRAM.md` for detailed architecture
- Examine the code in `backend/src/services/`

---

## Key Takeaways

✅ Tests self-heal automatically
✅ AI triages failures intelligently
✅ Zero manual maintenance required
✅ Engineers focus on writing tests, not fixing them
✅ High-confidence changes auto-apply
✅ Low-confidence changes queued for review
✅ Complete audit trail with healing history
✅ 99.6% faster than manual fixes

**Result:** Reliable test automation that adapts to application changes without manual intervention.
