import { db } from '../database/client';

export interface LocatorChange {
  id: string;
  testCaseId?: string;
  failureId?: string;
  oldLocator: {
    type: string;
    value: string;
  };
  newLocator: {
    type: string;
    value: string;
  };
  healingStrategy: string;
  confidence: number;
  status: 'pending_approval' | 'approved' | 'rejected' | 'auto_applied';
  appliedAt?: Date;
  success?: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class LocatorChangeModel {
  /**
   * Create a new locator change record
   */
  static async create(data: {
    testCaseId?: string;
    failureId?: string;
    oldLocator: { type: string; value: string };
    newLocator: { type: string; value: string };
    healingStrategy: string;
    confidence: number;
    status?: 'pending_approval' | 'approved' | 'rejected' | 'auto_applied';
    metadata?: any;
  }): Promise<LocatorChange> {
    const query = `
      INSERT INTO locator_changes (
        test_case_id, failure_id, old_locator, new_locator,
        healing_strategy, confidence, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id, test_case_id as "testCaseId", failure_id as "failureId",
        old_locator as "oldLocator", new_locator as "newLocator",
        healing_strategy as "healingStrategy", confidence, status,
        applied_at as "appliedAt", success, metadata,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await db.query(query, [
      data.testCaseId || null,
      data.failureId || null,
      JSON.stringify(data.oldLocator),
      JSON.stringify(data.newLocator),
      data.healingStrategy,
      data.confidence,
      data.status || 'pending_approval',
      JSON.stringify(data.metadata || {}),
    ]);

    return result.rows[0];
  }

  /**
   * Find locator change by ID
   */
  static async findById(id: string): Promise<LocatorChange | null> {
    const query = `
      SELECT
        id, test_case_id as "testCaseId", failure_id as "failureId",
        old_locator as "oldLocator", new_locator as "newLocator",
        healing_strategy as "healingStrategy", confidence, status,
        applied_at as "appliedAt", success, metadata,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM locator_changes
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * List locator changes with filters
   */
  static async list(filters?: {
    status?: string;
    minConfidence?: number;
    limit?: number;
    offset?: number;
  }): Promise<LocatorChange[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(filters.status);
    }

    if (filters?.minConfidence !== undefined) {
      conditions.push(`confidence >= $${paramCount++}`);
      params.push(filters.minConfidence);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        id, test_case_id as "testCaseId", failure_id as "failureId",
        old_locator as "oldLocator", new_locator as "newLocator",
        healing_strategy as "healingStrategy", confidence, status,
        applied_at as "appliedAt", success, metadata,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM locator_changes
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(filters?.limit || 50, filters?.offset || 0);

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Approve a locator change
   */
  static async approve(id: string): Promise<void> {
    const query = `
      UPDATE locator_changes
      SET status = 'approved', applied_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await db.query(query, [id]);
  }

  /**
   * Reject a locator change
   */
  static async reject(id: string): Promise<void> {
    const query = `
      UPDATE locator_changes
      SET status = 'rejected'
      WHERE id = $1
    `;

    await db.query(query, [id]);
  }

  /**
   * Mark as auto-applied
   */
  static async markAutoApplied(id: string, success: boolean): Promise<void> {
    const query = `
      UPDATE locator_changes
      SET status = 'auto_applied', applied_at = CURRENT_TIMESTAMP, success = $1
      WHERE id = $2
    `;

    await db.query(query, [success, id]);
  }

  /**
   * Get pending approval changes
   */
  static async getPendingApprovals(): Promise<LocatorChange[]> {
    const query = `
      SELECT
        id, test_case_id as "testCaseId", failure_id as "failureId",
        old_locator as "oldLocator", new_locator as "newLocator",
        healing_strategy as "healingStrategy", confidence, status,
        applied_at as "appliedAt", success, metadata,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM locator_changes
      WHERE status = 'pending_approval'
      ORDER BY created_at ASC
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Get healing statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    autoApplied: number;
    manuallyApproved: number;
    rejected: number;
    pending: number;
    successRate: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'auto_applied' THEN 1 END) as auto_applied,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as manually_approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) as pending,
        COALESCE(
          AVG(CASE WHEN success = true THEN 100 ELSE 0 END), 0
        ) as success_rate
      FROM locator_changes
    `;

    const result = await db.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      autoApplied: parseInt(row.auto_applied),
      manuallyApproved: parseInt(row.manually_approved),
      rejected: parseInt(row.rejected),
      pending: parseInt(row.pending),
      successRate: parseFloat(row.success_rate) || 0,
    };
  }
}
