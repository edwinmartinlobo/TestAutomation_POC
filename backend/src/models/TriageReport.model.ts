import { db } from '../database/client';
import { FailureCategory } from '../types/failure.types';

export interface TriageReport {
  id: string;
  failureId: string;
  category: FailureCategory;
  confidence: number;
  summary: string;
  aiAnalysis: {
    reasoning: string;
    evidencePoints: string[];
    suggestedActions: string[];
  };
  bugProbability: number;
  rootCause?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TriageReportModel {
  /**
   * Create a new triage report
   */
  static async create(data: {
    failureId: string;
    category: FailureCategory;
    confidence: number;
    summary: string;
    aiAnalysis: any;
    bugProbability: number;
    rootCause?: string;
  }): Promise<TriageReport> {
    const query = `
      INSERT INTO triage_reports (
        failure_id, category, confidence, summary, ai_analysis,
        bug_probability, root_cause
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id, failure_id as "failureId", category, confidence, summary,
        ai_analysis as "aiAnalysis", bug_probability as "bugProbability",
        root_cause as "rootCause", reviewed_by as "reviewedBy",
        reviewed_at as "reviewedAt", created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await db.query(query, [
      data.failureId,
      data.category,
      data.confidence,
      data.summary,
      JSON.stringify(data.aiAnalysis),
      data.bugProbability,
      data.rootCause || null,
    ]);

    return result.rows[0];
  }

  /**
   * Find triage report by ID
   */
  static async findById(id: string): Promise<TriageReport | null> {
    const query = `
      SELECT
        id, failure_id as "failureId", category, confidence, summary,
        ai_analysis as "aiAnalysis", bug_probability as "bugProbability",
        root_cause as "rootCause", reviewed_by as "reviewedBy",
        reviewed_at as "reviewedAt", created_at as "createdAt",
        updated_at as "updatedAt"
      FROM triage_reports
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find triage report by failure ID
   */
  static async findByFailureId(failureId: string): Promise<TriageReport | null> {
    const query = `
      SELECT
        id, failure_id as "failureId", category, confidence, summary,
        ai_analysis as "aiAnalysis", bug_probability as "bugProbability",
        root_cause as "rootCause", reviewed_by as "reviewedBy",
        reviewed_at as "reviewedAt", created_at as "createdAt",
        updated_at as "updatedAt"
      FROM triage_reports
      WHERE failure_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [failureId]);
    return result.rows[0] || null;
  }

  /**
   * List triage reports with filters
   */
  static async list(filters?: {
    category?: FailureCategory;
    minConfidence?: number;
    reviewed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<TriageReport[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.category) {
      conditions.push(`category = $${paramCount++}`);
      params.push(filters.category);
    }

    if (filters?.minConfidence !== undefined) {
      conditions.push(`confidence >= $${paramCount++}`);
      params.push(filters.minConfidence);
    }

    if (filters?.reviewed !== undefined) {
      if (filters.reviewed) {
        conditions.push(`reviewed_at IS NOT NULL`);
      } else {
        conditions.push(`reviewed_at IS NULL`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        id, failure_id as "failureId", category, confidence, summary,
        ai_analysis as "aiAnalysis", bug_probability as "bugProbability",
        root_cause as "rootCause", reviewed_by as "reviewedBy",
        reviewed_at as "reviewedAt", created_at as "createdAt",
        updated_at as "updatedAt"
      FROM triage_reports
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(filters?.limit || 50, filters?.offset || 0);

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Mark triage report as reviewed
   */
  static async markAsReviewed(id: string, reviewedBy: string): Promise<void> {
    const query = `
      UPDATE triage_reports
      SET reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await db.query(query, [reviewedBy, id]);
  }

  /**
   * Get statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    averageConfidence: number;
    reviewed: number;
    unreviewed: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN reviewed_at IS NOT NULL THEN 1 END) as reviewed,
        COUNT(CASE WHEN reviewed_at IS NULL THEN 1 END) as unreviewed,
        json_object_agg(category, category_count) as by_category
      FROM (
        SELECT
          category,
          COUNT(*) as category_count
        FROM triage_reports
        GROUP BY category
      ) category_counts, triage_reports
      GROUP BY ()
    `;

    const result = await db.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      byCategory: row.by_category || {},
      averageConfidence: parseFloat(row.avg_confidence) || 0,
      reviewed: parseInt(row.reviewed),
      unreviewed: parseInt(row.unreviewed),
    };
  }
}
