import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Router } from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { sessionMiddleware } from './middleware/session.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';
import { getContractMode, type ContractMode } from './openapi/runtimeMode.js';
import { responseCheck } from './openapi/responseCheck.js';
import { createAuthRouter } from './routes/auth.js';
import firmenRouter from './routes/firmen.js';
import personenRouter from './routes/personen.js';
import abteilungenRouter from './routes/abteilungen.js';
import adressenRouter from './routes/adressen.js';
import aktivitaetenRouter from './routes/aktivitaeten.js';
import chancenRouter from './routes/chancen.js';
import dashboardRouter from './routes/dashboard.js';
import agentTasksRouter from './routes/agentTasks.js';
import ticketsRouter from './routes/tickets.js';
import cronRouter from './routes/cron.js';
import szenarienRouter from './routes/szenario.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { version: string };

export interface ApiRouter {
  basePath: string;
  router: Router;
}

export function createApp(mode: ContractMode = getContractMode()): Express {
  const app = express();

  // Trust the first proxy hop (reverse proxy / TLS terminator) so that cookie.secure works correctly
  // in production. Without this, Express sees a plain-HTTP upstream connection and
  // suppresses Set-Cookie for secure cookies entirely.
  app.set('trust proxy', 1);

  // Middleware order matters: cors -> body parser -> session -> response check -> routes -> 404 -> error handler

  app.use(corsMiddleware);
  app.use(express.json());
  app.use(sessionMiddleware);

  if (mode === 'development' || (mode === 'test' && process.env['CONTRACT_RESPONSE_CHECK'] !== 'off')) {
    app.use(responseCheck(mode));
  }

  // Health check (public)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version });
  });

  // Routes
  const apiRouters: ApiRouter[] = [
    { basePath: '/api/auth', router: createAuthRouter(mode) },
    { basePath: '/api/firmen', router: firmenRouter },
    { basePath: '/api/personen', router: personenRouter },
    { basePath: '/api/abteilungen', router: abteilungenRouter },
    { basePath: '/api/adressen', router: adressenRouter },
    { basePath: '/api/aktivitaeten', router: aktivitaetenRouter },
    { basePath: '/api/chancen', router: chancenRouter },
    { basePath: '/api/dashboard', router: dashboardRouter },
    { basePath: '/api/agent-tasks', router: agentTasksRouter },
    { basePath: '/api/tickets', router: ticketsRouter },
    { basePath: '/api/cron', router: cronRouter },
    { basePath: '/api/szenarien', router: szenarienRouter },
  ];
  app.locals['apiRouters'] = apiRouters;
  for (const { basePath, router } of apiRouters) {
    app.use(basePath, router);
  }

  // Unknown /api path or method: JSON 404 in the standard error shape (no 405)
  app.use('/api', (_req, _res, next) => next(new NotFoundError('Ressource nicht gefunden')));

  // Error handler MUST be last
  app.use(errorHandler);

  return app;
}

export default createApp();
