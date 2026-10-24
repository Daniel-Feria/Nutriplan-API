import 'dotenv/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

const dbFile = process.env.DB_FILE;

if (!dbFile) {
  throw new Error('La variable de entorno DB_FILE no está definida.');
}

const databasePath = resolve(dbFile);

if (!existsSync(databasePath)) {
  throw new Error(
    `La base de datos no existe en ${databasePath}. Ejecuta npm run db:init primero.`,
  );
}

const db = new Database(databasePath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
