import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { firmaService } from '../services/firmaService.js';
import { personService } from '../services/personService.js';
import { abteilungService } from '../services/abteilungService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { specValidate } from '../openapi/specValidate.js';
import type { RequestBody } from '../openapi/types.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/firmen/all — non-paginated list
router.get(
  '/all',
  requireAuth,
  specValidate,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await firmaService.listAll());
  }),
);

// GET /api/firmen — paginated + search
router.get(
  '/',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'name',
      'ASC',
      'firma',
    );
    const search = req.query['search'] as string | undefined;
    res.json(await firmaService.findAll(search, page, size, sort));
  }),
);

// GET /api/firmen/:id/personen — paginated personen for a firma
router.get(
  '/:id/personen',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    res.json(await personService.findByFirmaId(id, page, size));
  }),
);

// GET /api/firmen/:id/abteilungen — paginated abteilungen for a firma
router.get(
  '/:id/abteilungen',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    res.json(await abteilungService.findByFirmaId(id, page, size));
  }),
);

// GET /api/firmen/:id
router.get(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await firmaService.findById(id));
  }),
);

// POST /api/firmen
router.post(
  '/',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const dto: RequestBody<'createFirma'> = req.body;
    res.status(201).json(await firmaService.create(dto));
  }),
);

// PUT /api/firmen/:id
router.put(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto: RequestBody<'updateFirma'> = req.body;
    res.json(await firmaService.update(id, dto));
  }),
);

// DELETE /api/firmen/:id
router.delete(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await firmaService.delete(id);
    res.status(204).send();
  }),
);

export default router;
