import { Request, Response } from 'express';
import { db } from '../database/client';
import { TriageReportModel } from '../models/TriageReport.model';
import { LocatorChangeModel } from '../models/LocatorChange.model';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Get dashboard summary
 */
export const getDashboardSummary = asyncHandler(
  async (req: Request, res: Response) => {
    // Get test runs summary
    const testRunsQuery = `
      SELECT
        COUNT(*) as total_runs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_runs,
        SUM(total_tests) as total_tests,
        SUM(passed) as total_passed,
        SUM(failed) as total_failed,
        SUM(skipped) as total_skipped
      FROM test_runs
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;

    const testRunsResult = await db.query(testRunsQuery);
    const testRunsData = testRunsResult.rows[0];

    // Calculate pass rate
    const totalTests = parseInt(testRunsData.total_tests) || 0;
    const totalPassed = parseInt(testRunsData.total_passed) || 0;
    const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : '0';

    // Get triage statistics
    const triageStats = await TriageReportModel.getStatistics();

    // Get healing statistics
    const healingStats = await LocatorChangeModel.getStatistics();

    // Get recent failures
    const recentFailuresQuery = `
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM failures
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    const recentFailuresResult = await db.query(recentFailuresQuery);

    res.json({
      success: true,
      data: {
        testRuns: {
          total: parseInt(testRunsData.total_runs),
          completed: parseInt(testRunsData.completed_runs),
          totalTests,
          passed: totalPassed,
          failed: parseInt(testRunsData.total_failed) || 0,
          skipped: parseInt(testRunsData.total_skipped) || 0,
          passRate: parseFloat(passRate),
        },
        triage: {
          total: triageStats.total,
          byCategory: triageStats.byCategory,
          averageConfidence: triageStats.averageConfidence,
          reviewed: triageStats.reviewed,
          unreviewed: triageStats.unreviewed,
        },
        healing: {
          total: healingStats.total,
          autoApplied: healingStats.autoApplied,
          manuallyApproved: healingStats.manuallyApproved,
          pending: healingStats.pending,
          successRate: healingStats.successRate,
        },
        recentFailures: recentFailuresResult.rows,
      },
    });
  }
);

/**
 * Get failure trends over time
 */
export const getFailureTrends = asyncHandler(
  async (req: Request, res: Response) => {
    const { days = '30' } = req.query;

    const query = `
      SELECT
        DATE(timestamp) as date,
        failure_type as type,
        COUNT(*) as count
      FROM failures
      WHERE timestamp >= NOW() - INTERVAL '${parseInt(days as string)} days'
      GROUP BY DATE(timestamp), failure_type
      ORDER BY date DESC
    `;

    const result = await db.query(query);

    // Group by date
    const trendsByDate: Record<string, any> = {};
    result.rows.forEach((row: any) => {
      const date = row.date.toISOString().split('T')[0];
      if (!trendsByDate[date]) {
        trendsByDate[date] = {
          date,
          byType: {},
          total: 0,
        };
      }
      trendsByDate[date].byType[row.type] = parseInt(row.count);
      trendsByDate[date].total += parseInt(row.count);
    });

    const trends = Object.values(trendsByDate).sort((a: any, b: any) =>
      a.date < b.date ? 1 : -1
    );

    res.json({
      success: true,
      data: trends,
    });
  }
);

/**
 * Get test health metrics
 */
export const getHealthMetrics = asyncHandler(
  async (req: Request, res: Response) => {
    // Get flaky tests (tests that have both passed and failed recently)
    const flakyTestsQuery = `
      SELECT
        test_name,
        COUNT(CASE WHEN status = 'passed' THEN 1 END) as pass_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as fail_count,
        COUNT(*) as total_runs
      FROM test_results
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY test_name
      HAVING
        COUNT(CASE WHEN status = 'passed' THEN 1 END) > 0
        AND COUNT(CASE WHEN status = 'failed' THEN 1 END) > 0
      ORDER BY fail_count DESC
      LIMIT 10
    `;

    const flakyTestsResult = await db.query(flakyTestsQuery);

    // Get slowest tests
    const slowTestsQuery = `
      SELECT
        test_name,
        AVG(duration_ms) as avg_duration,
        MAX(duration_ms) as max_duration,
        MIN(duration_ms) as min_duration
      FROM test_results
      WHERE
        created_at >= NOW() - INTERVAL '7 days'
        AND status = 'passed'
        AND duration_ms IS NOT NULL
      GROUP BY test_name
      ORDER BY avg_duration DESC
      LIMIT 10
    `;

    const slowTestsResult = await db.query(slowTestsQuery);

    // Get most failed tests
    const mostFailedQuery = `
      SELECT
        test_name,
        COUNT(*) as failure_count,
        MAX(created_at) as last_failure
      FROM test_results
      WHERE
        created_at >= NOW() - INTERVAL '7 days'
        AND status = 'failed'
      GROUP BY test_name
      ORDER BY failure_count DESC
      LIMIT 10
    `;

    const mostFailedResult = await db.query(mostFailedQuery);

    res.json({
      success: true,
      data: {
        flakyTests: flakyTestsResult.rows.map((row: any) => ({
          testName: row.test_name,
          passCount: parseInt(row.pass_count),
          failCount: parseInt(row.fail_count),
          totalRuns: parseInt(row.total_runs),
          flakinessRate: ((parseInt(row.fail_count) / parseInt(row.total_runs)) * 100).toFixed(2),
        })),
        slowestTests: slowTestsResult.rows.map((row: any) => ({
          testName: row.test_name,
          avgDuration: parseFloat(row.avg_duration),
          maxDuration: parseInt(row.max_duration),
          minDuration: parseInt(row.min_duration),
        })),
        mostFailedTests: mostFailedResult.rows.map((row: any) => ({
          testName: row.test_name,
          failureCount: parseInt(row.failure_count),
          lastFailure: row.last_failure,
        })),
      },
    });
  }
);

/**
 * Get failure breakdown by category
 */
export const getFailureBreakdown = asyncHandler(
  async (req: Request, res: Response) => {
    const { days = '30' } = req.query;

    const query = `
      SELECT
        tr.category,
        COUNT(*) as count,
        AVG(tr.confidence) as avg_confidence,
        AVG(tr.bug_probability) as avg_bug_probability
      FROM triage_reports tr
      JOIN failures f ON f.id = tr.failure_id
      WHERE f.timestamp >= NOW() - INTERVAL '${parseInt(days as string)} days'
      GROUP BY tr.category
      ORDER BY count DESC
    `;

    const result = await db.query(query);

    const breakdown = result.rows.map((row: any) => ({
      category: row.category,
      count: parseInt(row.count),
      avgConfidence: parseFloat(row.avg_confidence) || 0,
      avgBugProbability: parseFloat(row.avg_bug_probability) || 0,
    }));

    res.json({
      success: true,
      data: breakdown,
    });
  }
);
