import { failureAnalyzer } from './FailureAnalyzer.service';
import { FailureModel } from '../../models/Failure.model';
import { TriageReportModel } from '../../models/TriageReport.model';
import { logger } from '../../utils/logger';
import { FailureContext } from '../../types/failure.types';

export class TriageGeneratorService {
  /**
   * Generate triage report for a failure
   */
  async generateTriageReport(
    failureId: string,
    context: FailureContext
  ): Promise<string> {
    try {
      logger.info('Generating triage report', { failureId });

      // Check if triage report already exists
      const existing = await TriageReportModel.findByFailureId(failureId);
      if (existing) {
        logger.info('Triage report already exists', {
          failureId,
          reportId: existing.id,
        });
        return existing.id;
      }

      // Analyze the failure using AI
      const analysis = await failureAnalyzer.analyzeFailure(context);

      // Generate summary
      const summary = this.generateSummary(context, analysis);

      // Create triage report in database
      const report = await TriageReportModel.create({
        failureId,
        category: analysis.category,
        confidence: analysis.confidence,
        summary,
        aiAnalysis: {
          reasoning: analysis.reasoning,
          evidencePoints: analysis.evidencePoints,
          suggestedActions: analysis.suggestedActions,
        },
        bugProbability: analysis.bugProbability,
        rootCause: analysis.rootCause,
      });

      // Mark failure as analyzed
      await FailureModel.markAsAnalyzed(failureId);

      logger.info('Triage report generated successfully', {
        failureId,
        reportId: report.id,
        category: report.category,
        confidence: report.confidence,
      });

      return report.id;
    } catch (error: any) {
      logger.error('Failed to generate triage report', {
        failureId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate triage reports for multiple unanalyzed failures
   */
  async generateForUnanalyzedFailures(limit = 10): Promise<string[]> {
    try {
      logger.info('Processing unanalyzed failures', { limit });

      // Get unanalyzed failures
      const failures = await FailureModel.getUnanalyzed(limit);

      if (failures.length === 0) {
        logger.info('No unanalyzed failures found');
        return [];
      }

      logger.info('Found unanalyzed failures', { count: failures.length });

      // Generate triage reports for each failure
      const reportIds: string[] = [];
      for (const failure of failures) {
        try {
          const context: FailureContext = {
            testName: `Test-${failure.testResultId}`,
            platform: 'unknown', // Would need to fetch from test result
            errorMessage: failure.errorMessage,
            stackTrace: failure.stackTrace,
            locatorUsed: failure.locatorUsed,
          };

          const reportId = await this.generateTriageReport(failure.id, context);
          reportIds.push(reportId);
        } catch (error: any) {
          logger.error('Failed to generate triage for failure', {
            failureId: failure.id,
            error: error.message,
          });
          // Continue with other failures
        }
      }

      logger.info('Completed processing unanalyzed failures', {
        processed: reportIds.length,
        total: failures.length,
      });

      return reportIds;
    } catch (error: any) {
      logger.error('Failed to process unanalyzed failures', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate a human-readable summary
   */
  private generateSummary(context: FailureContext, analysis: any): string {
    const categoryDescriptions: Record<string, string> = {
      actual_bug: 'Application Bug',
      flaky_locator: 'Changed UI Element',
      timing_issue: 'Timing/Synchronization Issue',
      environmental_issue: 'Environment Problem',
      test_data_issue: 'Test Data Problem',
    };

    const categoryDesc = categoryDescriptions[analysis.category] || 'Unknown Issue';

    const confidenceLevel =
      analysis.confidence >= 80
        ? 'High'
        : analysis.confidence >= 50
        ? 'Medium'
        : 'Low';

    const bugLikelihood =
      analysis.bugProbability >= 70
        ? 'Likely a bug'
        : analysis.bugProbability >= 30
        ? 'Possibly a bug'
        : 'Unlikely to be a bug';

    return `${categoryDesc} detected in ${context.testName} (${confidenceLevel} confidence, ${analysis.confidence}%). ${bugLikelihood}.`;
  }

  /**
   * Re-analyze a failure with updated context
   */
  async regenerateTriageReport(
    reportId: string,
    updatedContext: FailureContext
  ): Promise<void> {
    try {
      logger.info('Regenerating triage report', { reportId });

      const report = await TriageReportModel.findById(reportId);
      if (!report) {
        throw new Error(`Triage report ${reportId} not found`);
      }

      // Re-analyze with updated context
      const analysis = await failureAnalyzer.analyzeFailure(updatedContext);

      // Update the report (would need an update method in the model)
      // For now, we'll just log
      logger.info('Triage report regenerated', {
        reportId,
        newCategory: analysis.category,
        newConfidence: analysis.confidence,
      });
    } catch (error: any) {
      logger.error('Failed to regenerate triage report', {
        reportId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get triage statistics
   */
  async getStatistics() {
    return await TriageReportModel.getStatistics();
  }
}

// Export singleton instance
export const triageGenerator = new TriageGeneratorService();
