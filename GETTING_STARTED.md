# Getting Started with AI Test Automation Framework

This guide will help you set up and run the AI-powered test automation framework from scratch.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** installed ([Download](https://nodejs.org/))
- **Docker & Docker Compose** installed ([Download](https://www.docker.com/))
- **Claude API Key** from Anthropic ([Get one here](https://console.anthropic.com/))
- **Android SDK** (for Android testing) or **Xcode** (for iOS testing, macOS only)
- **Git** for version control

## Step 1: Clone and Install Dependencies

```bash
# Navigate to the project directory
cd Test_Automation

# Install all dependencies (backend, frontend, test-suites)
npm run install:all
```

## Step 2: Configure Environment Variables

### Backend Configuration

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit the file and add your Claude API key
nano backend/.env  # or use your preferred editor
```

Add your Claude API key:
```env
CLAUDE_API_KEY=sk-ant-your-actual-api-key-here
```

### Docker Configuration

```bash
# Copy Docker environment example
cp docker/.env.example docker/.env

# Edit if needed (optional)
nano docker/.env
```

## Step 3: Start the Infrastructure

Start all services using Docker Compose:

```bash
# Start PostgreSQL, MinIO, Redis, Appium, Backend, and Frontend
npm run docker:up

# View logs (optional)
npm run docker:logs

# Stop services when done
npm run docker:down
```

### What Gets Started:

- **PostgreSQL** (port 5432) - Database for test results
- **MinIO** (ports 9000, 9001) - Object storage for screenshots
- **Redis** (port 6379) - Caching and job queues
- **Appium** (port 4723) - Mobile automation server
- **Backend API** (port 3000) - Node.js/Express server
- **Frontend Dashboard** (port 5173) - React application

## Step 4: Verify Installation

### Check Backend Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-13T...",
  "uptime": 123.45,
  "environment": "development"
}
```

### Access the Dashboard

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the dashboard (it will show zeros initially since no tests have run yet).

### Check Database Connection

```bash
# Connect to PostgreSQL
docker exec -it test-automation-db psql -U testuser -d test_automation

# List tables
\dt

# Exit
\q
```

## Step 5: Run Your First Test

### Option A: Using the Dashboard

1. Go to http://localhost:5173
2. Click **"Test Execution"** in the sidebar
3. Click **"Run Tests"**
4. Select platform (Android/iOS) and suite
5. Watch results appear in real-time

### Option B: Using the API

```bash
curl -X POST http://localhost:3000/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "suite": "mobile",
    "platform": "android"
  }'
```

### Option C: Direct Test Execution (For Development)

```bash
# Navigate to test suites
cd test-suites

# Run Android tests
npm run test:android

# Run API tests
npm run test:api
```

## Step 6: Understanding the Framework

### Self-Healing in Action

When a test fails due to a changed locator:

1. **Test Fails** - Element not found
2. **Fallback Tries** - Attempts alternative locators from `locators.json`
3. **AI Analysis** - If all fail, sends screenshot to Claude API
4. **Suggestion** - Claude suggests new, stable locators
5. **Auto-Apply** - If confidence > 85%, automatically applies and retries
6. **Manual Review** - If confidence < 85%, queues for approval in dashboard

View pending approvals:
```
http://localhost:5173/self-healing
```

### AI Triaging in Action

When any test fails:

1. **Failure Captured** - Screenshot, logs, stack trace collected
2. **AI Analysis** - Claude analyzes with vision API
3. **Categorization**:
   - **Actual Bug** - Real application issue
   - **Flaky Locator** - UI element changed
   - **Timing Issue** - Race condition/timeout
   - **Environmental Issue** - Infrastructure problem
4. **Confidence Score** - 0-100% confidence in categorization
5. **Suggested Actions** - What to do next

View triage reports:
```
http://localhost:5173/triage
```

## Step 7: Writing Your First Test

### Create a New Page Object

```typescript
// test-suites/mobile/android/page-objects/ProfilePage.ts
import { Browser } from 'webdriverio';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  constructor(driver: Browser) {
    super(driver, 'profilePage');
  }

  async clickEditProfile(): Promise<void> {
    await this.clickElement('editButton');
  }

  async updateName(name: string): Promise<void> {
    await this.enterText('nameInput', name);
  }
}
```

### Add Locators

```json
// test-suites/mobile/android/locators/locators.json
{
  "profilePage": {
    "editButton": {
      "primary": {
        "type": "id",
        "value": "com.example.app:id/edit_profile_btn"
      },
      "fallbacks": [
        {
          "type": "xpath",
          "value": "//android.widget.Button[@text='Edit Profile']"
        }
      ],
      "metadata": {
        "lastVerified": "2026-01-13",
        "healingHistory": [],
        "elementDescription": "Edit profile button"
      }
    }
  }
}
```

### Write the Test

```typescript
// test-suites/mobile/android/tests/profile.test.ts
import { ProfilePage } from '../page-objects/ProfilePage';

describe('Profile Tests', () => {
  let profilePage: ProfilePage;

  beforeEach(async () => {
    profilePage = new ProfilePage(driver);
  });

  it('should update profile name', async () => {
    await profilePage.clickEditProfile();
    await profilePage.updateName('John Doe');
    // Add assertions
  });
});
```

## Step 8: Monitoring and Debugging

### View Logs

```bash
# All services
npm run docker:logs

# Specific service
docker logs test-automation-backend -f
docker logs test-automation-frontend -f
docker logs test-automation-appium -f
```

### Access MinIO Console

View uploaded screenshots:
```
http://localhost:9001
Username: minioadmin
Password: minioadmin123
```

### Database Queries

```bash
# Connect to database
docker exec -it test-automation-db psql -U testuser -d test_automation

# View recent test runs
SELECT * FROM test_runs ORDER BY created_at DESC LIMIT 5;

# View failures
SELECT * FROM failures WHERE analyzed = false;

# View triage reports
SELECT category, COUNT(*) FROM triage_reports GROUP BY category;
```

## Common Commands

```bash
# Start everything
npm run docker:up

# Stop everything
npm run docker:down

# Restart a service
docker-compose -f docker/docker-compose.yml restart backend

# View service logs
docker-compose -f docker/docker-compose.yml logs backend -f

# Run tests
cd test-suites && npm run test:android

# Install dependencies
npm run install:all

# Build for production
npm run build
```

## Troubleshooting

### Backend won't start

**Problem:** `CLAUDE_API_KEY is required`
**Solution:** Add your API key to `backend/.env`

### Database connection fails

**Problem:** `Connection refused on port 5432`
**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker-compose -f docker/docker-compose.yml restart postgres
```

### Appium connection issues

**Problem:** `Could not connect to Appium server`
**Solution:**
```bash
# Check Appium logs
docker logs test-automation-appium

# Restart Appium
docker-compose -f docker/docker-compose.yml restart appium

# Verify Appium is running
curl http://localhost:4723/status
```

### Frontend shows connection errors

**Problem:** `Failed to fetch data from backend`
**Solution:**
1. Check backend is running: `curl http://localhost:3000/health`
2. Check browser console for CORS errors
3. Verify `VITE_API_URL` in frontend/.env

### Tests can't find elements

**Problem:** `Element not found` errors
**Solution:**
1. Check locators.json has correct values
2. Verify app is installed on device/emulator
3. Enable self-healing and let it suggest fixes
4. Check Appium logs for errors

## Configuration Options

### Self-Healing Settings

Edit `backend/src/config/app.config.ts`:

```typescript
selfHealing: {
  enabled: true,                    // Enable/disable self-healing
  autoApplyThreshold: 85,          // Auto-apply if confidence > 85%
  requireApproval: true,           // Queue low-confidence changes
  maxRetries: 3                    // Max retry attempts
}
```

### Claude API Settings

```typescript
claude: {
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 2000,
  temperature: 0.2
}
```

## Next Steps

1. **Add Your Tests** - Write tests for your application
2. **Configure Locators** - Add locators with fallback strategies
3. **Run Tests** - Execute and watch self-healing in action
4. **Review Triage** - Check AI analysis of failures
5. **Approve Changes** - Review and approve self-healing suggestions
6. **CI/CD Integration** - Add to your pipeline (see examples in `ci/` folder)

## API Documentation

Full API documentation available at:
- Triage: `http://localhost:3000/api/triage/*`
- Healing: `http://localhost:3000/api/healing/*`
- Dashboard: `http://localhost:3000/api/dashboard/*`
- Tests: `http://localhost:3000/api/tests/*`

## Support

For issues and questions:
1. Check logs: `npm run docker:logs`
2. Review troubleshooting section above
3. Check GitHub issues
4. Review API health: `curl http://localhost:3000/health`

## Production Deployment

For production deployment:
1. Use `docker-compose.prod.yml`
2. Set `NODE_ENV=production`
3. Use proper secret management (AWS Secrets Manager, Vault)
4. Configure reverse proxy (Nginx)
5. Set up monitoring (Prometheus, Grafana)
6. Enable SSL/TLS certificates

---

**Congratulations!** 🎉 Your AI-powered test automation framework is ready to use!
