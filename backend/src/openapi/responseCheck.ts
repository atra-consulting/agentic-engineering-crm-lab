import { appendFileSync } from 'node:fs';
import type { NextFunction, Request, Response } from 'express';
import { contract, findResponse, matchOperation, type ContractOperation } from './contract.js';
import type { ContractMode } from './runtimeMode.js';

export type CheckResult = { ok: true } | { ok: false; operationId: string; pointer: string; reason: string };

const OK: CheckResult = { ok: true };

/** Message of the first Ajv error: `<pointer>`, `<reason>`. Reads `.errors` at once (shared validators). */
function firstError(validator: { errors?: ReadonlyArray<{ instancePath: string; message?: string }> | null }): {
  pointer: string;
  reason: string;
} {
  const err = validator.errors?.[0];
  return { pointer: err?.instancePath || '/', reason: err?.message ?? 'invalid' };
}

/**
 * Checks a response body against the contract. Pure, never throws on bad input
 * (a body that cannot be serialized counts as a violation).
 * - production, 204: ok
 * - status >= 500, 413 (body-parser, never declared per operation) or no operation: validated against `ErrorResponse`
 * - status the operation does not declare: violation
 */
export function checkResponse(
  mode: ContractMode,
  op: ContractOperation | undefined,
  status: number,
  body: unknown,
): CheckResult {
  if (mode === 'production' || status === 204) return OK;
  const operationId = op?.operationId ?? 'unknown';
  let copy: unknown;
  try {
    // Round trip: validate what goes over the wire (Dates, undefined, ...).
    copy = body === undefined ? undefined : JSON.parse(JSON.stringify(body));
  } catch {
    return { ok: false, operationId, pointer: '/', reason: 'body is not serializable to JSON' };
  }
  if (status >= 500 || status === 413 || !op) {
    const validate = contract.errorResponseValidator;
    if (validate(copy)) return OK;
    return { ok: false, operationId, ...firstError(validate) };
  }
  const response = findResponse(op, status);
  if (!response) return { ok: false, operationId, pointer: '/', reason: 'undeclared status' };
  if (!response.validator) return OK;
  const validate = response.validator;
  if (validate(copy)) return OK;
  return { ok: false, operationId, ...firstError(validate) };
}

function resolveOp(req: Request, res: Response): ContractOperation | undefined {
  const local = (res.locals as { contractOp?: ContractOperation }).contractOp;
  return local ?? matchOperation(req.method, req.originalUrl);
}

const covered = new Set<string>();

/** Wraps `res.json` to check the body against the contract; collects coverage in test mode. Never throws. */
export function responseCheck(mode: ContractMode) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const originalJson = res.json.bind(res) as (body?: unknown) => Response;

      res.json = (body?: unknown): Response => {
        try {
          const status = res.statusCode;
          const result = checkResponse(mode, resolveOp(req, res), status, body);
          if (!result.ok) {
            console.error(`[contract] ${result.operationId} ${status} ${result.pointer}: ${result.reason}`);
            if (mode === 'test') {
              res.status(500);
              return originalJson({
                status: 500,
                message: `Antwort verletzt API-Vertrag: ${result.operationId} ${status} ${result.pointer} ${result.reason}`,
                timestamp: new Date().toISOString().replace(/Z$/, ''),
                fieldErrors: {},
              });
            }
            if (mode === 'development' && !res.headersSent) {
              res.setHeader('X-Contract-Violation', `${result.operationId} ${result.pointer}`);
            }
          }
        } catch (err) {
          console.error('[contract] response check failed internally', err);
        }
        return originalJson(body);
      };

      const coverageFile = process.env['CONTRACT_COVERAGE_FILE'];
      if (mode === 'test' && coverageFile) {
        res.on('finish', () => {
          try {
            if (res.statusCode < 200 || res.statusCode > 299) return;
            const id = resolveOp(req, res)?.operationId;
            if (!id || covered.has(id)) return;
            covered.add(id);
            appendFileSync(coverageFile, `${id}\n`);
          } catch (err) {
            console.error('[contract] coverage write failed', err);
          }
        });
      }
    } catch (err) {
      console.error('[contract] response check setup failed', err);
    }
    next();
  };
}
