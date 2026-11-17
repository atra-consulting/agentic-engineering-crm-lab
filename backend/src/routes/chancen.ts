import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { chanceService } from '../services/chanceService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { specValidate } from '../openapi/specValidate.js';
import type { RequestBody } from '../openapi/types.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';
import { CHANCE_PHASE, type ChancePhase } from '../db/schema/enums.js';

const router = Router();

// GET /api/chancen/all
router.get(
  '/all',
  requireAuth,
  specValidate,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await chanceService.listAll());
  }),
);

// GET /api/chancen — paginated
router.get(
  '/',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'createdAt',
      'DESC',
      'chance',
    );
    const searchRaw = req.query['search'];
    const searchFirst = Array.isArray(searchRaw) ? searchRaw[0] : searchRaw;
    const search = typeof searchFirst === 'string' ? searchFirst : undefined;
    const phaseRaw = req.query['phase'] as string | undefined;
    if (phaseRaw !== undefined && !(CHANCE_PHASE as readonly string[]).includes(phaseRaw)) {
      const msg = `Ungültiger phase-Wert: ${phaseRaw}. Erlaubt: ${CHANCE_PHASE.join(', ')}`;
      throw new ValidationError(msg, { phase: msg });
    }
    const phase = phaseRaw as ChancePhase | undefined;
    res.json(await chanceService.findAll(search, page, size, sort, phase));
  }),
);

// GET /api/chancen/:id
router.get(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await chanceService.findById(id));
  }),
);

// POST /api/chancen
router.post(
  '/',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const dto: RequestBody<'createChance'> = req.body;
    res.status(201).json(await chanceService.create(dto));
  }),
);

// PUT /api/chancen/:id
router.put(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto: RequestBody<'updateChance'> = req.body;
    res.json(await chanceService.update(id, dto));
  }),
);

// DELETE /api/chancen/:id
router.delete(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await chanceService.delete(id);
    res.status(204).send();
  }),
);

export default router;
