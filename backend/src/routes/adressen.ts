import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adresseService } from '../services/adresseService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { specValidate } from '../openapi/specValidate.js';
import type { RequestBody } from '../openapi/types.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/adressen/all
router.get(
  '/all',
  requireAuth,
  specValidate,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await adresseService.listAll());
  }),
);

// GET /api/adressen — paginated + search
router.get(
  '/',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'city',
      'ASC',
      'adresse',
    );
    const search = req.query['search'] as string | undefined;
    res.json(await adresseService.findAll(search, page, size, sort));
  }),
);

// GET /api/adressen/:id
router.get(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await adresseService.findById(id));
  }),
);

// POST /api/adressen
router.post(
  '/',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const dto: RequestBody<'createAdresse'> = req.body;
    res.status(201).json(await adresseService.create(dto));
  }),
);

// PUT /api/adressen/:id
router.put(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto: RequestBody<'updateAdresse'> = req.body;
    res.json(await adresseService.update(id, dto));
  }),
);

// DELETE /api/adressen/:id
router.delete(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await adresseService.delete(id);
    res.status(204).send();
  }),
);

export default router;
