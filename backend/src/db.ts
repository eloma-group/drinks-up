import pg from 'pg';
import { config } from './config.js';

// numeric / bigint columns come back as strings by default — return JS numbers instead
pg.types.setTypeParser(1700, v => parseFloat(v)); // numeric
pg.types.setTypeParser(20, v => parseInt(v, 10)); // int8 (count(*))

export const pool = new pg.Pool({
  connectionString: config.databaseUrl.replace(/[?&]sslmode=require/, ''),
  ssl: config.databaseSsl || /sslmode=require/.test(config.databaseUrl) ? { rejectUnauthorized: true } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
});

// An idle connection can be closed by the server (restart, failover, Azure maintenance, db reset).
// Without this handler the 'error' event would crash the whole API process.
pool.on('error', err => console.error('[db] idle connection error (pool will reconnect):', err.message));

export const q =<T extends pg.QueryResultRow = any>(text: string, params?: unknown[]) => pool.query<T>(text, params);

/** Run `fn` inside a transaction. */
export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    const r = await fn(c);
    await c.query('commit');
    return r;
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    c.release();
  }
}
