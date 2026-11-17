import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboard } from '../services/dashboardService.js';
import { specValidate } from '../openapi/specValidate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  specValidate,
  asyncHandler(async (_req, res) => {
    res.json(await getDashboard());
  }),
);

export default router;
