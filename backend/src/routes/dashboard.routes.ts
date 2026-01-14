import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// Get dashboard summary
router.get('/summary', dashboardController.getDashboardSummary);

// Get failure trends
router.get('/trends', dashboardController.getFailureTrends);

// Get health metrics
router.get('/health', dashboardController.getHealthMetrics);

// Get failure breakdown by category
router.get('/failure-breakdown', dashboardController.getFailureBreakdown);

export default router;
