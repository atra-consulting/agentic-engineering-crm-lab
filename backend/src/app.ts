import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Router } from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { sessionMiddleware } from './middleware/session.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';
import { getContractMode, isDevOrTest, type ContractMode } from './openapi/runtimeMode.js';
import { responseCheck } from './openapi/responseCheck.js';
import { specValidate } from './openapi/specValidate.js';
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
import type { JsonResponse } from './openapi/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { version: string };

const OPENAPI_JSON_PATH = join(__dirname, 'generated/openapi.json');

/** Whitelist of files served under /api/docs/assets/ (file name -> content type). */
const DOCS_ASSETS: ReadonlyMap<string, string> = new Map([
  ['swagger-ui.css', 'text/css; charset=utf-8'],
  ['swagger-ui-bundle.js', 'text/javascript; charset=utf-8'],
  ['swagger-ui.css.map', 'application/json; charset=utf-8'],
  ['swagger-ui-bundle.js.map', 'application/json; charset=utf-8'],
]);

const DOCS_INIT_JS =
  "window.onload = function () {\n  window.ui = SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#swagger-ui', withCredentials: true });\n};\n";

const DOCS_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CRM API docs</title>
<link rel="stylesheet" href="/api/docs/assets/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="/api/docs/assets/swagger-ui-bundle.js"></script>
<script src="/api/docs/assets/docs-init.js"></script>
</body>
</html>
`;

let swaggerUiDirPromise: Promise<string> | undefined;

/** Loads swagger-ui-dist lazily (first use only); production never reaches this. */
function getSwaggerUiDir(): Promise<string> {
  swaggerUiDirPromise ??= import('swagger-ui-dist').then((m) => {
    const mod = m as unknown as { getAbsoluteFSPath?: () => string; default?: { getAbsoluteFSPath: () => string } };
    const fn = mod.getAbsoluteFSPath ?? mod.default?.getAbsoluteFSPath;
    if (!fn) throw new Error('swagger-ui-dist: getAbsoluteFSPath not found');
    return fn();
  });
  return swaggerUiDirPromise;
}

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
  app.get('/api/health', specValidate, (_req, res) => {
    const body: JsonResponse<'getHealth', 200> = { status: 'ok', timestamp: new Date().toISOString(), version };
    res.json(body);
  });

  // Interactive API docs: development and test only (production falls through to the JSON 404)
  if (isDevOrTest(mode)) {
    app.get('/api/openapi.json', (_req, res) => {
      res.sendFile(OPENAPI_JSON_PATH);
    });
    app.get('/api/docs', (_req, res) => {
      res.type('text/html; charset=utf-8').send(DOCS_HTML);
    });
    app.get('/api/docs/assets/docs-init.js', (_req, res) => {
      res.type('text/javascript; charset=utf-8').send(DOCS_INIT_JS);
    });
    app.get('/api/docs/assets/:file', async (req, res, next) => {
      try {
        const file = req.params['file'] ?? '';
        const contentType = DOCS_ASSETS.get(file);
        if (!contentType) {
          next(new NotFoundError('Ressource nicht gefunden'));
          return;
        }
        res.type(contentType).sendFile(join(await getSwaggerUiDir(), file), { dotfiles: 'deny' }, (err) => {
          if (err) next(err);
        });
      } catch (err) {
        next(err);
      }
    });
  }

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
