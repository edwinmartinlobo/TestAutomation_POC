export enum FailureCategory {
  ACTUAL_BUG = 'actual_bug',
  FLAKY_LOCATOR = 'flaky_locator',
  TIMING_ISSUE = 'timing_issue',
  ENVIRONMENTAL_ISSUE = 'environmental_issue',
  TEST_DATA_ISSUE = 'test_data_issue',
}

export enum FailureType {
  LOCATOR_NOT_FOUND = 'locator_not_found',
  ASSERTION_FAILED = 'assertion_failed',
  TIMEOUT = 'timeout',
  CRASH = 'crash',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown',
}

export interface FailureAnalysisResult {
  category: FailureCategory;
  confidence: number; // 0-100
  reasoning: string;
  evidencePoints: string[];
  suggestedActions: string[];
  rootCause?: string;
  bugProbability: number; // 0-100
}

export interface LocatorSuggestion {
  type: string;
  value: string;
  confidence: number;
  reasoning: string;
}

export interface LocatorSuggestionResult {
  suggestedLocators: LocatorSuggestion[];
  elementDescription: string;
  additionalNotes?: string;
}

export interface FailureContext {
  testName: string;
  platform: string;
  errorMessage: string;
  stackTrace: string;
  locatorUsed?: string;
  screenshot?: string;
  logs?: string[];
  previousResults?: any[];
}
