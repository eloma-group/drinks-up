/** Dev helper: drop + recreate the local `drinksup` database (UTF-8) and re-seed it. */
import pg from 'pg';
import { applySchema } from './migrate.ts';
import { seed } from '../seed/seed.ts';
const PORT = Number(process.env.PGPORT_DEV || 5433);
const admin = new pg.Client({ host: 'localhost', port: PORT, user: 'postgres', password: 'postgres', database: 'postgres' });
await admin.connect();
await admin.query('drop database if exists drinksup with (force)');
await admin.query("create database drinksup encoding 'UTF8' lc_collate 'C' lc_ctype 'C' template template0");
await admin.end();
const url = `postgres://postgres:postgres@localhost:${PORT}/drinksup`;
await applySchema(url);
await seed(url);
