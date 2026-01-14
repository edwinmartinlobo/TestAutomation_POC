import { db } from '../database/client';
import { FailureType } from '../types/failure.types';

export interface Failure {
  id: string;
  testResultId: string;
  failureType: FailureType;
  errorMessage: string;
  stackTrace: string;
  locatorUsed?: string;
  logSnippet?: string;
  timestamp: Date;
  analyzed: boolean;
}

export class FailureModel {
  /**
   * Create a new failure record
   */
  static async create(data: {
    testResultId: string;
    failureType: FailureType;
    errorMessage: string;
    stackTrace: string;
    locatorUsed?: string;
    logSnippet?: string;
  }): Promise<Failure> {
    const query = `
      INSERT INTO failures (
        test_result_id, failure_type, error_message, stack_trace,
        locator_used, log_snippet
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id, test_result_id as "testResultId", failure_type as "failureType",
        error_message as "errorMessage", stack_trace as "stackTrace",
        locator_used as "locatorUsed", log_snippet as "logSnippet",
        timestamp, analyzed
    `;

    const result = await db.query(query, [
      data.testResultId,
      data.failureType,
      data.errorMessage,
      data.stackTrace,
      data.locatorUsed || null,
      data.logSnippet || null,
    ]);

    return result.rows[0];
  }

  /**
   * Find failure by ID
   */
  static async findById(id: string): Promise<Failure | null> {
    const query = `
      SELECT
        id, test_result_id as "testResultId", failure_type as "failureType",
        error_message as "errorMessage", stack_trace as "stackTrace",
        locator_used as "locatorUsed", log_snippet as "logSnippet",
        timestamp, analyzed
      FROM failures
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find failures by test result ID
   */
  static async findByTestResultId(testResultId: string): Promise<Failure[]> {
    const query = `
      SELECT
        id, test_result_id as "testResultId", failure_type as "failureType",
        error_message as "errorMessage", stack_trace as "stackTrace",
        locator_used as "locatorUsed", log_snippet as "logSnippet",
        timestamp, analyzed
      FROM failures
      WHERE test_result_id = $1
      ORDER BY timestamp DESC
    `;

    const result = await db.query(query, [testResultId]);
    return result.rows;
  }

  /**
   * Mark failure as analyzed
   */
  static async markAsAnalyzed(id: string): Promise<void> {
    const query = `
      UPDATE failures
      SET analyzed = true
      WHERE id = $1
    `;

    await db.query(query, [id]);
  }

  /**
   * Get unanalyzed failures
   */
  static async getUnanalyzed(limit = 10): Promise<Failure[]> {
    const query = `
      SELECT
        id, test_result_id as "testResultId", failure_type as "failureType",
        error_message as "errorMessage", stack_trace as "stackTrace",
        locator_used as "locatorUsed", log_snippet as "logSnippet",
        timestamp, analyzed
      FROM failures
      WHERE analyzed = false
      ORDER BY timestamp ASC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /**
   * List failures with filters
   */
  static async list(filters?: {
    failureType?: FailureType;
    analyzed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Failure[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.failureType) {
      conditions.push(`failure_type = $${paramCount++}`);
      params.push(filters.failureType);
    }

    if (filters?.analyzed !== undefined) {
      conditions.push(`analyzed = $${paramCount++}`);
      params.push(filters.analyzed);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        id, test_result_id as "testResultId", failure_type as "failureType",
        error_message as "errorMessage", stack_trace as "stackTrace",
        locator_used as "locatorUsed", log_snippet as "logSnippet",
        timestamp, analyzed
      FROM failures
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(filters?.limit || 50, filters?.offset || 0);

    const result = await db.query(query, params);
    return result.rows;
  }
}
