import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const bad = (msg: string) => new HttpError(400, msg);
export const notFound = (what = 'Not found') => new HttpError(404, what);

/** Parse and validate a request body with zod; throws a 400 with a readable message. */
export function parse<T>(schema: ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    const i = r.error.issues[0];
    throw bad(`${i.path.join('.') || 'body'}: ${i.message}`);
  }
  return r.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof ZodError) return res.status(400).json({ error: err.issues[0]?.message || 'Invalid request' });
  const e = err as { type?: string; status?: number; message?: string };
  if (e?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (e?.status === 413) return res.status(413).json({ error: 'Request too large' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

/** Tiny in-memory fixed-window rate limiter (per IP + route). Good enough for a single App Service instance. */
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) {
      hits.set(key, { n: 1, reset: now + windowMs });
      if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
      return next();
    }
    if (++h.n > max) {
      res.setHeader('Retry-After', Math.ceil((h.reset - now) / 1000));
      return res.status(429).json({ error: 'Too many requests — please wait a moment and try again.' });
    }
    next();
  };
}
