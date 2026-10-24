import 'dotenv/config';
import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';

if (!process.env.DB_FILE) {
  throw new Error('La variable de entorno DB_FILE no está definida.');
}

const DB_PATH = resolve(process.env.DB_FILE);
const alimentos = JSON.parse(
  readFileSync(new URL('./alimentos-base.json', import.meta.url), 'utf8'),
);

const db = new Database(DB_PATH);

try {
  const tablaExiste = db.prepare(`
    SELECT 1
    FROM sqlite_master
    WHERE type = 'table' AND name = 'alimentos'
  `).get();

  if (!tablaExiste) {
    throw new Error('La tabla alimentos no existe. Ejecuta primero npm run db:init.');
  }

  const insertarSiVacia = db.transaction(() => {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM alimentos').get();

    if (total > 0) {
      return false;
    }

    const insertar = db.prepare(`
      INSERT INTO alimentos (nombre, calorias, proteina, carbohidratos, grasa)
      VALUES (@nombre, @calorias, @proteina, @carbohidratos, @grasa)
    `);

    for (const alimento of alimentos) {
      insertar.run(alimento);
    }

    return true;
  });

  if (insertarSiVacia()) {
    console.log(`Se insertaron ${alimentos.length} alimentos (valores por cada 100 g).`);
  } else {
    console.log('La tabla alimentos ya tiene registros; no se insertó ningún alimento.');
  }
} finally {
  db.close();
}
