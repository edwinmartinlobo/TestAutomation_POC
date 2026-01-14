import { Router } from 'express';

const router = Router();

// Placeholder routes
router.get('/', (req, res) => {
  res.status(501).json({ message: 'List results endpoint - Coming soon' });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Get result details endpoint - Coming soon' });
});

export default router;
