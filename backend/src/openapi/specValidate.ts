/**
 * Express middleware: validates path params and the request body against the
 * OpenAPI contract. Put it right before the final handler, after the auth guards.
 *
 * - Stores the matched operation in `res.locals['contractOp']` (the response check reads it).
 * - Path params: a COPY of `req.params` is validated, `req.params` stays untouched.
 * - Body: validated on a clone (the validator mutates and strips). On success the
 *   stripped clone replaces `req.body`. Without a declared requestBody, `req.body` is untouched.
 * - Synchronous. Never throws; every failure goes to `next()`.
 */
import type { NextFunction, Request, Response } from 'express';
import { findOperation } from './contract.js';
import { mapAjvErrors, toValidationError } from './errorMapper.js';

export function specValidate(req: Request, res: Response, next: NextFunction): void {
  try {
    const routePath: unknown = req.route?.path;
    const op = typeof routePath === 'string' ? findOperation(req.method, req.baseUrl + routePath) : undefined;
    if (!op) {
      const shown = typeof routePath === 'string' ? req.baseUrl + routePath : req.originalUrl;
      next(new Error(`No contract operation for ${req.method} ${shown}`));
      return;
    }
    res.locals['contractOp'] = op;
    if (op.skipRequestValidation) {
      next();
      return;
    }

    if (op.pathParamsValidator) {
      const params: Record<string, unknown> = { ...req.params };
      if (!op.pathParamsValidator(params)) {
        next(toValidationError(mapAjvErrors(op.pathParamsValidator.errors, 'path', op)));
        return;
      }
    }

    if (op.bodyValidator) {
      const body: unknown = structuredClone(req.body ?? {});
      if (!op.bodyValidator(body)) {
        next(toValidationError(mapAjvErrors(op.bodyValidator.errors, 'body', op)));
        return;
      }
      req.body = body;
    }
    next();
  } catch (err) {
    next(err);
  }
}
