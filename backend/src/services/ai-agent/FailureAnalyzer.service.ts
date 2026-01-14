import { claudeClient } from './ClaudeClient.service';
import { logger } from '../../utils/logger';
import {
  FailureContext,
  FailureAnalysisResult,
  FailureCategory,
  LocatorSuggestionResult,
} from '../../types/failure.types';

export class FailureAnalyzerService {
  /**
   * Analyze a test failure using AI
   */
  async analyzeFailure(context: FailureContext): Promise<FailureAnalysisResult> {
    try {
      logger.info('Starting failure analysis', {
        testName: context.testName,
        platform: context.platform,
        hasScreenshot: !!context.screenshot,
      });

      // Call Claude API with context
      const response = await claudeClient.analyzeFailure({
        testName: context.testName,
        platform: context.platform,
        errorMessage: context.errorMessage,
        stackTrace: context.stackTrace,
        locatorUsed: context.locatorUsed,
        screenshot: context.screenshot,
      });

      // Parse JSON response
      const analysis = claudeClient.parseJsonResponse<FailureAnalysisResult>(response);

      // Validate and normalize the analysis
      const normalizedAnalysis = this.normalizeAnalysis(analysis);

      logger.info('Failure analysis completed', {
        testName: context.testName,
        category: normalizedAnalysis.category,
        confidence: normalizedAnalysis.confidence,
      });

      return normalizedAnalysis;
    } catch (error: any) {
      logger.error('Failure analysis failed', {
        error: error.message,
        testName: context.testName,
      });

      // Return a fallback analysis based on error patterns
      return this.getFallbackAnalysis(context);
    }
  }

  /**
   * Suggest better locators for a failed element
   */
  async suggestLocators(params: {
    locatorType: string;
    locatorValue: string;
    error: string;
    pageContext: string;
    screenshot: string;
  }): Promise<LocatorSuggestionResult> {
    try {
      logger.info('Requesting locator suggestions', {
        locatorType: params.locatorType,
        locatorValue: params.locatorValue,
      });

      const response = await claudeClient.suggestLocator(params);
      const suggestions = claudeClient.parseJsonResponse<LocatorSuggestionResult>(response);

      logger.info('Locator suggestions received', {
        count: suggestions.suggestedLocators.length,
      });

      return suggestions;
    } catch (error: any) {
      logger.error('Locator suggestion failed', {
        error: error.message,
      });

      // Return empty suggestions on failure
      return {
        suggestedLocators: [],
        elementDescription: 'Unable to analyze element',
        additionalNotes: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Calculate confidence score for healing
   */
  calculateHealingConfidence(params: {
    strategy: string;
    locatorType: string;
    previousFailures: number;
    elementStability: number;
  }): number {
    let confidence = 50; // Base confidence

    // Strategy-based adjustments
    switch (params.strategy) {
      case 'ai_suggested':
        confidence += 30;
        break;
      case 'similarity_match':
        confidence += 20;
        break;
      case 'fallback_chain':
        confidence += 25;
        break;
    }

    // Locator type adjustments (more stable = higher confidence)
    switch (params.locatorType) {
      case 'id':
      case 'accessibilityId':
        confidence += 15;
        break;
      case 'xpath':
        confidence += 5;
        break;
      case 'class':
        confidence += 0;
        break;
    }

    // Previous failures adjustment (more failures = lower confidence)
    if (params.previousFailures > 5) {
      confidence -= 20;
    } else if (params.previousFailures > 2) {
      confidence -= 10;
    }

    // Element stability adjustment
    confidence += params.elementStability * 10;

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Normalize and validate AI analysis result
   */
  private normalizeAnalysis(analysis: any): FailureAnalysisResult {
    // Validate category
    const validCategories = Object.values(FailureCategory);
    const category = validCategories.includes(analysis.category)
      ? analysis.category
      : FailureCategory.UNKNOWN;

    // Ensure confidence is in range
    const confidence = Math.max(0, Math.min(100, analysis.confidence || 50));

    // Calculate bug probability based on category and confidence
    const bugProbability = this.calculateBugProbability(category, confidence);

    return {
      category,
      confidence,
      reasoning: analysis.reasoning || 'No reasoning provided',
      evidencePoints: Array.isArray(analysis.evidencePoints)
        ? analysis.evidencePoints
        : [],
      suggestedActions: Array.isArray(analysis.suggestedActions)
        ? analysis.suggestedActions
        : [],
      rootCause: analysis.rootCause || undefined,
      bugProbability,
    };
  }

  /**
   * Calculate probability that this is an actual bug
   */
  private calculateBugProbability(category: FailureCategory, confidence: number): number {
    const categoryProbabilities: Record<FailureCategory, number> = {
      [FailureCategory.ACTUAL_BUG]: 90,
      [FailureCategory.FLAKY_LOCATOR]: 10,
      [FailureCategory.TIMING_ISSUE]: 30,
      [FailureCategory.ENVIRONMENTAL_ISSUE]: 5,
      [FailureCategory.TEST_DATA_ISSUE]: 20,
    };

    const baseProbability = categoryProbabilities[category] || 50;

    // Adjust based on confidence
    const adjustment = ((confidence - 50) / 50) * 20;

    return Math.max(0, Math.min(100, baseProbability + adjustment));
  }

  /**
   * Fallback analysis when AI fails - use rule-based heuristics
   */
  private getFallbackAnalysis(context: FailureContext): FailureAnalysisResult {
    logger.warn('Using fallback rule-based analysis', {
      testName: context.testName,
    });

    const errorLower = context.errorMessage.toLowerCase();
    const stackLower = context.stackTrace.toLowerCase();

    // Rule-based categorization
    let category = FailureCategory.UNKNOWN;
    let reasoning = 'Fallback rule-based analysis';
    const evidencePoints: string[] = [];

    // Check for locator issues
    if (
      errorLower.includes('element not found') ||
      errorLower.includes('no such element') ||
      errorLower.includes('could not find')
    ) {
      category = FailureCategory.FLAKY_LOCATOR;
      reasoning = 'Error message indicates element not found';
      evidencePoints.push('Element not found error detected');
    }
    // Check for timeout issues
    else if (
      errorLower.includes('timeout') ||
      errorLower.includes('timed out') ||
      errorLower.includes('wait')
    ) {
      category = FailureCategory.TIMING_ISSUE;
      reasoning = 'Error message indicates timeout';
      evidencePoints.push('Timeout error detected');
    }
    // Check for network issues
    else if (
      errorLower.includes('network') ||
      errorLower.includes('connection') ||
      errorLower.includes('econnrefused')
    ) {
      category = FailureCategory.ENVIRONMENTAL_ISSUE;
      reasoning = 'Error message indicates network/connection issue';
      evidencePoints.push('Network error detected');
    }
    // Check for assertion failures
    else if (
      errorLower.includes('assertion') ||
      errorLower.includes('expected') ||
      errorLower.includes('actual')
    ) {
      category = FailureCategory.ACTUAL_BUG;
      reasoning = 'Assertion failure likely indicates a bug';
      evidencePoints.push('Assertion failure detected');
    }

    const bugProbability = this.calculateBugProbability(category, 50);

    return {
      category,
      confidence: 50, // Lower confidence for rule-based
      reasoning,
      evidencePoints,
      suggestedActions: [
        'Review error message and stack trace',
        'Check recent code changes',
        'Verify test environment',
      ],
      rootCause: undefined,
      bugProbability,
    };
  }

  /**
   * Batch analyze multiple failures
   */
  async batchAnalyze(failures: FailureContext[]): Promise<FailureAnalysisResult[]> {
    logger.info('Starting batch failure analysis', {
      count: failures.length,
    });

    const results = await Promise.all(
      failures.map((failure) => this.analyzeFailure(failure))
    );

    return results;
  }
}

// Export singleton instance
export const failureAnalyzer = new FailureAnalyzerService();
