import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented in Phase 2
router.post('/run', (req, res) => {
  res.status(501).json({ message: 'Test execution endpoint - Coming soon' });
});

router.get('/runs', (req, res) => {
  res.status(501).json({ message: 'List test runs endpoint - Coming soon' });
});

router.get('/runs/:id', (req, res) => {
  res.status(501).json({ message: 'Get test run details endpoint - Coming soon' });
});

export default router;
