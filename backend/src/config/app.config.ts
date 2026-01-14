import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://testuser:testpass123@localhost:5432/test_automation',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10')
  },

  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.2')
  },

  appium: {
    host: process.env.APPIUM_HOST || 'localhost',
    port: parseInt(process.env.APPIUM_PORT || '4723'),
    path: process.env.APPIUM_PATH || '/',
    protocol: process.env.APPIUM_PROTOCOL || 'http'
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 'minio',
    endpoint: process.env.MINIO_ENDPOINT || 'localhost:9000',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    useSSL: process.env.MINIO_USE_SSL === 'true',
    bucket: process.env.MINIO_BUCKET || 'test-artifacts',
    region: process.env.MINIO_REGION || 'us-east-1'
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0')
  },

  selfHealing: {
    enabled: process.env.SELF_HEALING_ENABLED !== 'false',
    autoApplyThreshold: parseInt(process.env.SELF_HEALING_THRESHOLD || '85'),
    requireApproval: process.env.SELF_HEALING_REQUIRE_APPROVAL !== 'false',
    maxRetries: parseInt(process.env.SELF_HEALING_MAX_RETRIES || '3')
  },

  testExecution: {
    maxParallelTests: parseInt(process.env.MAX_PARALLEL_TESTS || '5'),
    defaultTimeout: parseInt(process.env.DEFAULT_TEST_TIMEOUT || '300000'), // 5 minutes
    screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
    captureConsoleLogs: process.env.CAPTURE_CONSOLE_LOGS !== 'false'
  },

  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
    channels: (process.env.NOTIFICATION_CHANNELS || 'console').split(','),
    slackWebhook: process.env.SLACK_WEBHOOK_URL || '',
    emailFrom: process.env.EMAIL_FROM || '',
    emailTo: process.env.EMAIL_TO || ''
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs'
  }
};

// Validation
export const validateConfig = (): void => {
  const errors: string[] = [];

  if (!appConfig.claude.apiKey) {
    errors.push('CLAUDE_API_KEY is required');
  }

  if (!appConfig.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};
