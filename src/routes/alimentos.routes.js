import { Router } from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { validateRequest } from '../middlewares/validate.middleware.js';

const router = Router();
const alimentosQuerySchema = z.object({
  nombre: z.string().trim().optional(),
});

router.get('/', validateRequest(alimentosQuerySchema, 'query'), (req, res) => {
  const { nombre } = req.validated.query;
  const alimentos = nombre
    ? db.prepare(`
      SELECT id, nombre, calorias, proteina, carbohidratos, grasa
      FROM alimentos
      WHERE nombre LIKE ? ESCAPE '\\'
      ORDER BY nombre COLLATE NOCASE, id
    `).all(`%${nombre.replace(/[\\%_]/g, '\\$&')}%`)
    : db.prepare(`
      SELECT id, nombre, calorias, proteina, carbohidratos, grasa
      FROM alimentos
      ORDER BY nombre COLLATE NOCASE, id
    `).all();

  return res.json({
    success: true,
    message: 'Alimentos obtenidos correctamente.',
    data: alimentos,
  });
});

export default router;
