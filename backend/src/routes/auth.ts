import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { findByBenutzername } from '../config/users.js';
import { requireAuth } from '../middleware/auth.js';
import { UnauthorizedError } from '../utils/errors.js';
import { specValidate } from '../openapi/specValidate.js';
import type { JsonResponse, Schema } from '../openapi/types.js';
import { isDevOrTest, type ContractMode } from '../openapi/runtimeMode.js';

type Rolle = Schema<'Rolle'>;
type Permission = Schema<'Permission'>;

const ROLLEN: readonly string[] = ['ROLE_ADMIN', 'ROLE_USER'];
const PERMISSIONS: readonly string[] = [
  'FIRMEN', 'PERSONEN', 'ABTEILUNGEN', 'ADRESSEN', 'AKTIVITAETEN', 'CHANCEN', 'BENUTZERVERWALTUNG',
];

function isRolle(value: string): value is Rolle {
  return ROLLEN.includes(value);
}

function isPermission(value: string): value is Permission {
  return PERMISSIONS.includes(value);
}

function toRollen(roles: string[]): Rolle[] {
  return roles.map((r) => `ROLE_${r}`).filter(isRolle);
}

export function createAuthRouter(mode: ContractMode): Router {
  const router = Router();

  // POST /api/auth/login
  router.post('/login', specValidate, (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { benutzername, passwort } = req.body as {
        benutzername?: string;
        passwort?: string;
      };

      if (!benutzername || !passwort) {
        next(new UnauthorizedError('Ungültige Anmeldedaten'));
        return;
      }

      const user = findByBenutzername(benutzername);
      if (!user) {
        next(new UnauthorizedError('Ungültige Anmeldedaten'));
        return;
      }

      const passwordValid = bcrypt.compareSync(passwort, user.passwordHash);
      if (!passwordValid) {
        next(new UnauthorizedError('Ungültige Anmeldedaten'));
        return;
      }

      // Regenerate session to prevent fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          next(err);
          return;
        }
        req.session.userId = user.id;
        const body: JsonResponse<'login', 200> = {
          benutzername: user.benutzername,
          vorname: user.vorname,
          nachname: user.nachname,
          rollen: toRollen(user.roles),
        };
        res.json(body);
      });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/auth/logout
  router.post('/logout', specValidate, (req: Request, res: Response, next: NextFunction): void => {
    req.session.destroy((err) => {
      if (err) {
        next(err);
        return;
      }
      res.clearCookie('JSESSIONID');
      const body: JsonResponse<'logout', 200> = {};
      res.json(body);
    });
  });

  // GET /api/auth/me
  router.get('/me', requireAuth, specValidate, (req: Request, res: Response): void => {
    const user = req.currentUser!;
    const body: JsonResponse<'getCurrentUser', 200> = {
      id: user.id,
      benutzername: user.benutzername,
      vorname: user.vorname,
      nachname: user.nachname,
      email: `${user.benutzername}@crm.local`,
      rollen: toRollen(user.roles),
      permissions: user.permissions.filter(isPermission),
    };
    res.json(body);
  });

  // POST /api/auth/test-login — only in development/test mode (for Playwright tests)
  if (isDevOrTest(mode)) {
    router.post('/test-login', specValidate, (req: Request, res: Response, next: NextFunction): void => {
      try {
        const { benutzername } = req.body as { benutzername?: string };

        if (!benutzername) {
          next(new UnauthorizedError('benutzername required'));
          return;
        }

        const user = findByBenutzername(benutzername);
        if (!user) {
          next(new UnauthorizedError('Benutzer nicht gefunden'));
          return;
        }

        req.session.regenerate((err) => {
          if (err) {
            next(err);
            return;
          }
          req.session.userId = user.id;
          const body: JsonResponse<'testLogin', 200> = {
            benutzername: user.benutzername,
            vorname: user.vorname,
            nachname: user.nachname,
            rollen: toRollen(user.roles),
          };
          res.json(body);
        });
      } catch (err) {
        next(err);
      }
    });
  }

  return router;
}
