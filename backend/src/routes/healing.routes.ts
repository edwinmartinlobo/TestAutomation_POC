import { Router } from 'express';
import * as healingController from '../controllers/healing.controller';

const router = Router();

// List locator changes
router.get('/changes', healingController.listLocatorChanges);

// Get specific locator change
router.get('/changes/:id', healingController.getLocatorChange);

// Get pending approvals
router.get('/pending', healingController.getPendingApprovals);

// Approve a locator change
router.post('/changes/:id/approve', healingController.approveLocatorChange);

// Reject a locator change
router.post('/changes/:id/reject', healingController.rejectLocatorChange);

// Get healing statistics
router.get('/statistics', healingController.getHealingStatistics);

// Trigger healing for a failure
router.post('/trigger', healingController.triggerHealing);

export default router;
