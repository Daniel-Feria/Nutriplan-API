import { Router } from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { sendError } from '../utils/error.util.js';

const router = Router();
const alimentosQuerySchema = z.object({
  nombre: z.string().trim().optional(),
});
const alimentoParamsSchema = z.object({
  id: z.string()
    .regex(/^[1-9]\d*$/, 'El ID debe ser un entero positivo.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'El ID debe ser un entero válido.'),
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

router.get('/:id', validateRequest(alimentoParamsSchema, 'params'), (req, res) => {
  const { id } = req.validated.params;
  const alimento = db.prepare(`
    SELECT id, nombre, calorias, proteina, carbohidratos, grasa
    FROM alimentos
    WHERE id = ?
  `).get(id);

  if (!alimento) {
    return sendError(res, 404, 'Alimento no encontrado.');
  }

  return res.json({
    success: true,
    message: 'Alimento obtenido correctamente.',
    data: alimento,
  });
});

export default router;
