/**
 * Route chain: in every route of the app, `specValidate` appears exactly once,
 * immediately before the last handler. Also checks the Express registration order
 * of routes that would collide (`/next` vs `/:id`).
 */
import { test, expect } from '@playwright/test';
import type { Express, RequestHandler } from 'express';
import { createApp, type ApiRouter } from '../app.js';
import { specValidate } from '../openapi/specValidate.js';

interface HandlerLayer {
  handle: RequestHandler;
  name: string;
}
interface RouteInfo {
  path: string;
  methods: Record<string, boolean>;
  stack: HandlerLayer[];
}
interface RouterLayer {
  route?: RouteInfo;
}
interface RouterWithStack {
  stack: RouterLayer[];
}
interface AppWithRouter extends Express {
  _router: RouterWithStack;
}

interface FlatRoute {
  label: string;
  fullPath: string;
  stack: HandlerLayer[];
}

const DOCS_EXEMPT = (path: string): boolean => path.startsWith('/api/docs') || path === '/api/openapi.json';

function methodsOf(route: RouteInfo): string {
  return Object.keys(route.methods).filter((m) => route.methods[m]).join(',').toUpperCase();
}

const app = createApp('test');
const apiRouters = app.locals['apiRouters'] as ApiRouter[];

function routesOf(basePath: string, router: RouterWithStack): FlatRoute[] {
  return router.stack
    .filter((l): l is RouterLayer & { route: RouteInfo } => l.route !== undefined)
    .map((l) => {
      const fullPath = basePath + (l.route.path === '/' ? '' : l.route.path);
      return { label: `${methodsOf(l.route)} ${fullPath}`, fullPath, stack: l.route.stack };
    });
}

const allRoutes: FlatRoute[] = [];
for (const { basePath, router } of apiRouters) {
  allRoutes.push(...routesOf(basePath, router as unknown as RouterWithStack));
}
// Top-level routes on the app itself (for example /api/health).
allRoutes.push(...routesOf('', (app as AppWithRouter)._router).filter((r) => r.fullPath.startsWith('/api/')));

function isSpecValidate(layer: HandlerLayer): boolean {
  return layer.handle === specValidate || layer.name === 'specValidate';
}

function routePaths(basePath: string): string[] {
  const entry = apiRouters.find((r) => r.basePath === basePath);
  if (!entry) throw new Error(`No router for ${basePath}`);
  return (entry.router as unknown as RouterWithStack).stack
    .filter((l) => l.route !== undefined)
    .map((l) => (l.route as RouteInfo).path);
}

function expectBefore(basePath: string, first: string, later: (p: string) => boolean): void {
  const paths = routePaths(basePath);
  const firstIdx = paths.indexOf(first);
  expect(firstIdx, `${basePath}${first} must be registered`).toBeGreaterThanOrEqual(0);
  paths.forEach((p, idx) => {
    if (later(p)) expect(firstIdx, `${basePath}${first} must come before ${p}`).toBeLessThan(idx);
  });
}

test.describe('contract route chain', () => {
  test('finds routes, including /api/health', () => {
    expect(allRoutes.length).toBeGreaterThan(20);
    expect(allRoutes.map((r) => r.fullPath)).toContain('/api/health');
  });

  test('specValidate appears exactly once, immediately before the last handler, in every route', () => {
    const problems: string[] = [];
    for (const r of allRoutes) {
      if (DOCS_EXEMPT(r.fullPath)) continue;
      const positions = r.stack.map((l, i) => (isSpecValidate(l) ? i : -1)).filter((i) => i >= 0);
      if (positions.length !== 1) {
        problems.push(`${r.label}: specValidate appears ${positions.length} times`);
      } else if (positions[0] !== r.stack.length - 2) {
        problems.push(`${r.label}: specValidate at position ${positions[0]} of ${r.stack.length}, expected right before the last handler`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('agent-tasks: /next is registered before /:id', () => {
    expectBefore('/api/agent-tasks', '/next', (p) => p === '/:id');
  });

  test('tickets: /next, /board, /summary are registered before /:id', () => {
    for (const first of ['/next', '/board', '/summary']) {
      expectBefore('/api/tickets', first, (p) => p === '/:id');
    }
  });

  test('abteilungen: /firma/:firmaId is registered before the /:id routes', () => {
    expectBefore('/api/abteilungen', '/firma/:firmaId', (p) => p.startsWith('/:id'));
  });
});
