/** Apply database/schema.sql to DATABASE_URL.  `--reset` drops everything first. */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function clientFor(url: string) {
  const ssl = process.env.DATABASE_SSL === 'true' || /sslmode=require/.test(url);
  return new pg.Client({ connectionString: url.replace(/[?&]sslmode=require/, ''), ssl: ssl ? { rejectUnauthorized: true } : undefined });
}

export async function applySchema(url: string, reset = false) {
  const db = clientFor(url);
  await db.connect();
  try {
    if (reset) {
      await db.query('drop schema public cascade; create schema public;');
      console.log('[migrate] schema dropped');
    }
    await db.query(readFileSync(path.join(root, 'schema.sql'), 'utf8'));
    console.log('[migrate] schema applied');
  } finally {
    await db.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/drinksup';
  await applySchema(url, process.argv.includes('--reset'));
}
