# AI-Powered Test Automation Framework

An intelligent test automation framework for mobile (iOS/Android) and API testing with AI-powered failure triaging and self-healing capabilities.

## Features

### 🤖 AI-Powered Failure Triaging
- Automatically analyzes test failures using Claude AI with vision capabilities
- Categorizes failures as:
  - **Actual Bugs** - Real application issues
  - **Flaky Locators** - Changed UI elements
  - **Timing Issues** - Race conditions or timeouts
  - **Environmental Issues** - Infrastructure problems
- Provides confidence scores and detailed reasoning

### 🔧 Self-Healing Test Scripts
- Automatically detects changed locators
- Multiple healing strategies:
  - AI-suggested locators
  - Similarity-based matching
  - Fallback locator chains
- Auto-applies high-confidence fixes (>85%)
- Manual approval queue for low-confidence changes

### 📱 Mobile & API Testing
- Cross-platform mobile testing (iOS & Android) using Appium
- API testing with comprehensive validation
- Screenshot and log capture
- Page Object pattern with enhanced capabilities

### 📊 Interactive Dashboard
- Real-time test execution monitoring
- Failure trend analysis
- Triage report visualization
- Self-healing approval queue
- Health metrics and insights

## Architecture

```
test-automation-framework/
├── backend/          # Node.js + Express API
├── frontend/         # React dashboard
├── test-suites/      # Mobile & API test cases
├── database/         # PostgreSQL migrations
└── docker/           # Docker Compose setup
```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma
- **Frontend**: React, Vite, TypeScript, Material-UI
- **Mobile Automation**: Appium 2.x, WebDriverIO
- **AI Integration**: Claude API (Anthropic)
- **Database**: PostgreSQL, MinIO (artifact storage)
- **Deployment**: Docker, Docker Compose

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Claude API key ([Get one here](https://console.anthropic.com/))
- Android SDK (for Android testing)
- Xcode (for iOS testing, macOS only)

## Quick Start

### 1. Clone and Install

```bash
# Install dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env and add your Claude API key
CLAUDE_API_KEY=your_api_key_here
```

### 3. Start with Docker

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### 4. Access the Dashboard

Open http://localhost:5173 in your browser

### 5. Run a Test

```bash
# Trigger a test run via API
curl -X POST http://localhost:3000/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{"suite": "mobile", "platform": "android"}'
```

## Development

### Run Backend Only

```bash
npm run dev:backend
```

### Run Frontend Only

```bash
npm run dev:frontend
```

### Run Both

```bash
npm run dev
```

### Database Migrations

```bash
npm run db:migrate
```

## Configuration

### Self-Healing Settings

Edit `backend/src/config/app.config.ts`:

```typescript
selfHealing: {
  enabled: true,
  autoApplyThreshold: 85,  // Auto-apply if confidence > 85%
  requireApproval: true,   // Queue low-confidence changes
  maxRetries: 3
}
```

### Appium Configuration

Edit `backend/src/config/appium.config.ts` for Android/iOS device settings.

## API Endpoints

### Test Execution
- `POST /api/tests/run` - Trigger test execution
- `GET /api/tests/runs` - List test runs
- `GET /api/tests/runs/:id` - Get test run details

### Triage Reports
- `GET /api/triage/reports` - List AI triage reports
- `POST /api/triage/analyze/:failureId` - Trigger AI analysis
- `GET /api/triage/statistics` - Get triage statistics

### Self-Healing
- `GET /api/healing/changes` - List locator changes
- `POST /api/healing/changes/:id/approve` - Approve change
- `GET /api/healing/statistics` - Healing success rate

## Writing Tests

### Mobile Test Example

```typescript
// test-suites/mobile/android/tests/login.test.ts
import { LoginPage } from '../page-objects/LoginPage';

describe('Login Flow', () => {
  it('should login successfully', async () => {
    const loginPage = new LoginPage(driver);
    await loginPage.enterUsername('testuser');
    await loginPage.enterPassword('password123');
    await loginPage.clickLogin();

    // Assertion
    expect(await loginPage.isLoggedIn()).toBe(true);
  });
});
```

### API Test Example

```typescript
// test-suites/api/tests/user-api.test.ts
import { apiClient } from '../helpers/api-client';

describe('User API', () => {
  it('should create a new user', async () => {
    const response = await apiClient.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    });

    expect(response.status).toBe(201);
    expect(response.data.name).toBe('John Doe');
  });
});
```

## How It Works

### 1. Test Execution Flow
```
User triggers test → TestOrchestrator → MobileTestRunner/ApiTestRunner
→ Execute tests → Capture results → Store in database
```

### 2. Failure Detection & AI Analysis
```
Test fails → Capture screenshot + logs → FailureAnalyzer
→ Send to Claude API (vision + text) → Categorize + analyze
→ Generate triage report → Store and notify
```

### 3. Self-Healing
```
Flaky locator detected → LocatorHealer tries strategies
→ AI-suggested / Similarity match / Fallback chain
→ Validate new locator → Apply or queue for approval
→ Retry test
```

## Monitoring & Metrics

The dashboard tracks:
- Test pass/fail rates
- Failure category breakdown
- Self-healing success rate
- AI confidence scores
- Execution trends over time

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start framework
        run: docker-compose -f docker/docker-compose.yml up -d
      - name: Run tests
        run: |
          curl -X POST http://localhost:3000/api/tests/run \
            -H "Content-Type: application/json" \
            -d '{"suite": "smoke"}'
```

## Troubleshooting

### Appium Connection Issues
```bash
# Check Appium server status
docker-compose logs appium

# Restart Appium
docker-compose restart appium
```

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Run migrations
npm run db:migrate
```

### Claude API Errors
- Verify your API key in `.env`
- Check API rate limits
- View backend logs: `docker-compose logs backend`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ using Claude AI
