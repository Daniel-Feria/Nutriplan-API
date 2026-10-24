import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';

// Si no existe la variable de entorno, muestro un error
if (!process.env.DB_FILE) {
  throw new Error('La variable de entorno DB_FILE no está definida.');
}

const DB_PATH = resolve(process.env.DB_FILE);
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

try {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre        TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alimentos (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre        TEXT    NOT NULL,
      calorias      REAL    NOT NULL,
      proteina      REAL    NOT NULL DEFAULT 0,
      carbohidratos REAL    NOT NULL DEFAULT 0,
      grasa         REAL    NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS comidas (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id  INTEGER NOT NULL,
      alimento_id INTEGER NOT NULL,
      gramos      REAL    NOT NULL CHECK (gramos > 0),
      fecha       DATE    NOT NULL,
      tipo        TEXT    NOT NULL CHECK (tipo IN ('desayuno', 'almuerzo', 'cena', 'snack')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (alimento_id) REFERENCES alimentos(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_comidas_usuario_fecha ON comidas (usuario_id, fecha);
    CREATE INDEX IF NOT EXISTS idx_comidas_alimento ON comidas (alimento_id);
    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);
  `);

  console.log(`Base de datos inicializada correctamente: ${DB_PATH}`);
} finally {
  db.close();
}
