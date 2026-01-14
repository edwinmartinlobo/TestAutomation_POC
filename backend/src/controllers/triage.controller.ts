import { Request, Response, NextFunction } from 'express';
import { TriageReportModel } from '../models/TriageReport.model';
import { triageGenerator } from '../services/ai-agent/TriageGenerator.service';
import { FailureModel } from '../models/Failure.model';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

/**
 * List triage reports
 */
export const listTriageReports = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      category,
      minConfidence,
      reviewed,
      limit = '50',
      offset = '0',
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (category) filters.category = category;
    if (minConfidence) filters.minConfidence = parseInt(minConfidence as string);
    if (reviewed !== undefined) filters.reviewed = reviewed === 'true';

    const reports = await TriageReportModel.list(filters);

    res.json({
      success: true,
      data: reports,
      meta: {
        limit: filters.limit,
        offset: filters.offset,
        count: reports.length,
      },
    });
  }
);

/**
 * Get triage report by ID
 */
export const getTriageReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const report = await TriageReportModel.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Triage report not found',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  }
);

/**
 * Analyze a failure and generate triage report
 */
export const analyzeFailure = asyncHandler(
  async (req: Request, res: Response) => {
    const { failureId } = req.params;

    // Get failure details
    const failure = await FailureModel.findById(failureId);

    if (!failure) {
      return res.status(404).json({
        success: false,
        error: 'Failure not found',
      });
    }

    // Check if already analyzed
    const existingReport = await TriageReportModel.findByFailureId(failureId);
    if (existingReport) {
      return res.json({
        success: true,
        data: existingReport,
        message: 'Triage report already exists',
      });
    }

    // Generate triage report
    const reportId = await triageGenerator.generateTriageReport(failureId, {
      testName: `Test-${failure.testResultId}`,
      platform: 'unknown', // Would need to fetch from test result
      errorMessage: failure.errorMessage,
      stackTrace: failure.stackTrace,
      locatorUsed: failure.locatorUsed,
    });

    const report = await TriageReportModel.findById(reportId);

    res.status(201).json({
      success: true,
      data: report,
      message: 'Triage report generated successfully',
    });
  }
);

/**
 * Mark triage report as reviewed
 */
export const markAsReviewed = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviewedBy } = req.body;

    if (!reviewedBy) {
      return res.status(400).json({
        success: false,
        error: 'reviewedBy is required',
      });
    }

    const report = await TriageReportModel.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Triage report not found',
      });
    }

    await TriageReportModel.markAsReviewed(id, reviewedBy);

    res.json({
      success: true,
      message: 'Triage report marked as reviewed',
    });
  }
);

/**
 * Get triage statistics
 */
export const getTriageStatistics = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await triageGenerator.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  }
);

/**
 * Process unanalyzed failures
 */
export const processUnanalyzedFailures = asyncHandler(
  async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;

    logger.info('Processing unanalyzed failures', {
      limit: parseInt(limit as string),
    });

    const reportIds = await triageGenerator.generateForUnanalyzedFailures(
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        processed: reportIds.length,
        reportIds,
      },
      message: `Processed ${reportIds.length} unanalyzed failures`,
    });
  }
);
