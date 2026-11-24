import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export type StaffClaims = { sub: string; name: string; role: string; email: string };

export const signStaff = (c: StaffClaims) => jwt.sign(c, config.jwtSecret, { audience: 'staff', expiresIn: '12h' });
export const signCustomer = (id: string) => jwt.sign({ sub: id }, config.jwtSecret, { audience: 'customer', expiresIn: '30d' });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staff?: StaffClaims;
    }
  }
}

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Please sign in' });
  try {
    req.staff = jwt.verify(token, config.jwtSecret, { audience: 'staff' }) as StaffClaims;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired — please sign in again' });
  }
}
