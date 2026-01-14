import { Request, Response } from 'express';
import { LocatorChangeModel } from '../models/LocatorChange.model';
import { locatorHealer } from '../services/self-healing/LocatorHealer.service';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

/**
 * List locator changes
 */
export const listLocatorChanges = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      status,
      minConfidence,
      limit = '50',
      offset = '0',
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (status) filters.status = status;
    if (minConfidence) filters.minConfidence = parseInt(minConfidence as string);

    const changes = await LocatorChangeModel.list(filters);

    res.json({
      success: true,
      data: changes,
      meta: {
        limit: filters.limit,
        offset: filters.offset,
        count: changes.length,
      },
    });
  }
);

/**
 * Get locator change by ID
 */
export const getLocatorChange = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const change = await LocatorChangeModel.findById(id);

    if (!change) {
      return res.status(404).json({
        success: false,
        error: 'Locator change not found',
      });
    }

    res.json({
      success: true,
      data: change,
    });
  }
);

/**
 * Get pending approvals
 */
export const getPendingApprovals = asyncHandler(
  async (req: Request, res: Response) => {
    const approvals = await locatorHealer.getPendingApprovals();

    res.json({
      success: true,
      data: approvals,
      meta: {
        count: approvals.length,
      },
    });
  }
);

/**
 * Approve a locator change
 */
export const approveLocatorChange = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const change = await LocatorChangeModel.findById(id);
    if (!change) {
      return res.status(404).json({
        success: false,
        error: 'Locator change not found',
      });
    }

    if (change.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve change with status: ${change.status}`,
      });
    }

    logger.info('Approving locator change', { id });

    const success = await locatorHealer.approveChange(id);

    res.json({
      success: true,
      data: {
        id,
        applied: success,
      },
      message: success
        ? 'Locator change approved and applied'
        : 'Locator change approved but application failed',
    });
  }
);

/**
 * Reject a locator change
 */
export const rejectLocatorChange = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const change = await LocatorChangeModel.findById(id);
    if (!change) {
      return res.status(404).json({
        success: false,
        error: 'Locator change not found',
      });
    }

    if (change.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: `Cannot reject change with status: ${change.status}`,
      });
    }

    logger.info('Rejecting locator change', { id, reason });

    await locatorHealer.rejectChange(id);

    res.json({
      success: true,
      message: 'Locator change rejected',
    });
  }
);

/**
 * Get healing statistics
 */
export const getHealingStatistics = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await locatorHealer.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  }
);

/**
 * Trigger healing for a specific failure
 */
export const triggerHealing = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page,
      element,
      failedLocator,
      fallbackLocators,
      error,
      screenshot,
      failureId,
    } = req.body;

    if (!page || !element || !failedLocator || !error) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: page, element, failedLocator, error',
      });
    }

    logger.info('Triggering locator healing', { page, element });

    const result = await locatorHealer.healLocator({
      page,
      element,
      failedLocator,
      fallbackLocators,
      error,
      screenshot,
      failureId,
    });

    res.json({
      success: true,
      data: result,
      message: result.success
        ? 'Locator healed successfully'
        : 'Healing failed',
    });
  }
);
