import { Router } from 'express';
import * as triageController from '../controllers/triage.controller';

const router = Router();

// List triage reports
router.get('/reports', triageController.listTriageReports);

// Get specific triage report
router.get('/reports/:id', triageController.getTriageReport);

// Analyze a failure
router.post('/analyze/:failureId', triageController.analyzeFailure);

// Mark as reviewed
router.put('/reports/:id/review', triageController.markAsReviewed);

// Get statistics
router.get('/statistics', triageController.getTriageStatistics);

// Process unanalyzed failures
router.post('/process-unanalyzed', triageController.processUnanalyzedFailures);

export default router;
