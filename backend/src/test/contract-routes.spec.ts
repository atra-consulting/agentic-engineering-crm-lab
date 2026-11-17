/**
 * Contract routes: the Express route table equals the operations in the bundle.
 * `/api/docs*` and `/api/openapi.json` are exempt.
 */
import { test, expect } from '@playwright/test';
import type { Express } from 'express';
import { createApp, type ApiRouter } from '../app.js';
import { operations } from './contract-helpers.js';

interface Layer {
  route?: { path: unknown; methods: Record<string, boolean> };
}
interface RouterLike {
  stack: Layer[];
}

const EXEMPT = (key: string): boolean => {
  const path = key.split(' ')[1] ?? '';
  return path === '/api/openapi.json' || path === '/api/docs' || path.startsWith('/api/docs/');
};

function toContractPath(p: string): string {
  return p.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function collect(prefix: string, router: RouterLike, out: Set<string>): void {
  for (const layer of router.stack) {
    const route = layer.route;
    if (!route) continue;
    if (typeof route.path !== 'string') {
      throw new Error(`Non-string route path under ${prefix}: ${String(route.path)}`);
    }
    let full = `${prefix}${route.path === '/' ? '' : route.path}`;
    if (full.length > 1 && full.endsWith('/')) full = full.slice(0, -1);
    for (const [method, enabled] of Object.entries(route.methods)) {
      if (!enabled || method === '_all') continue;
      out.add(`${method.toUpperCase()} ${toContractPath(full)}`);
    }
  }
}

test.describe('contract routes', () => {
  const app: Express = createApp('test');
  const apiRouters = app.locals['apiRouters'] as ApiRouter[];
  const actual = new Set<string>();
  collect('', (app as unknown as { _router: RouterLike })._router, actual);
  for (const { basePath, router } of apiRouters) {
    collect(basePath, router as unknown as RouterLike, actual);
  }
  const expected = new Set(operations.map((o) => `${o.method} ${o.fullPath}`));

  test('app exposes the 12 api routers', () => {
    expect(apiRouters).toHaveLength(12);
  });

  test('every contract operation has a route', () => {
    const missing = [...expected].filter((k) => !actual.has(k)).sort();
    expect(missing, `in contract, no route: ${missing.join('; ')}`).toEqual([]);
  });

  test('every route has a contract operation', () => {
    const extra = [...actual].filter((k) => !expected.has(k) && !EXEMPT(k)).sort();
    expect(extra, `route without contract operation: ${extra.join('; ')}`).toEqual([]);
  });
});
