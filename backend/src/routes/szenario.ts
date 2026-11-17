import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { szenarioService } from '../services/szenarioService.js';
import { specValidate } from '../openapi/specValidate.js';
import type { RequestBody } from '../openapi/types.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/szenarien
router.get(
  '/',
  requireAuth,
  specValidate,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await szenarioService.list());
  }),
);

// GET /api/szenarien/:id
router.get(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await szenarioService.findById(id));
  }),
);

// POST /api/szenarien
router.post(
  '/',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const dto: RequestBody<'createSzenario'> = req.body;
    res.status(201).json(await szenarioService.create(dto));
  }),
);

// PUT /api/szenarien/:id
router.put(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto: RequestBody<'updateSzenario'> = req.body;
    res.json(await szenarioService.update(id, dto));
  }),
);

// DELETE /api/szenarien/:id
router.delete(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await szenarioService.delete(id);
    res.status(204).send();
  }),
);

export default router;
