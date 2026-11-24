/**
 * Local development database.
 * Starts a real PostgreSQL server (embedded binaries, no install needed) on port 5433,
 * keeps its data in database/.pgdata, creates the `drinksup` database, and applies the
 * schema + seed the first time. Production uses Azure Database for PostgreSQL instead.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { applySchema } from './migrate.ts';
import { seed } from '../seed/seed.ts';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = path.join(root, '.pgdata');
const PORT = Number(process.env.PGPORT_DEV || 5433);
const fresh = !existsSync(path.join(dataDir, 'PG_VERSION'));

const server = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {},
});

if (fresh) await server.initialise();
await server.start();

const admin = new pg.Client({ host: 'localhost', port: PORT, user: 'postgres', password: 'postgres', database: 'postgres' });
await admin.connect();
const exists = await admin.query("select 1 from pg_database where datname='drinksup'");
if (!exists.rowCount) await admin.query("create database drinksup encoding 'UTF8' lc_collate 'C' lc_ctype 'C' template template0");
await admin.end();

const url = `postgres://postgres:postgres@localhost:${PORT}/drinksup`;
const db = new pg.Client({ connectionString: url });
await db.connect();
const hasSchema = await db.query("select to_regclass('public.products') as t");
await db.end();
if (!hasSchema.rows[0].t) {
  console.log('[db] applying schema + seed…');
  await applySchema(url);
  await seed(url);
}
console.log(`[db] PostgreSQL ready → ${url}`);

const stop = async () => {
  console.log('\n[db] stopping…');
  await server.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
