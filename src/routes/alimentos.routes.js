import { Router } from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { sendError } from '../utils/error.util.js';

const router = Router();
const alimentoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(100),
  calorias: z.number().nonnegative('Las calorías deben ser mayores o iguales a 0.'),
  proteina: z.number().nonnegative('La proteína debe ser mayor o igual a 0.'),
  carbohidratos: z.number().nonnegative('Los carbohidratos deben ser mayores o iguales a 0.'),
  grasa: z.number().nonnegative('La grasa debe ser mayor o igual a 0.'),
});
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

router.post('/', authMiddleware, validateRequest(alimentoSchema), (req, res) => {
  const { nombre, calorias, proteina, carbohidratos, grasa } = req.validated.body;
  const result = db.prepare(`
    INSERT INTO alimentos (nombre, calorias, proteina, carbohidratos, grasa)
    VALUES (@nombre, @calorias, @proteina, @carbohidratos, @grasa)
  `).run({ nombre, calorias, proteina, carbohidratos, grasa });

  return res.status(201).json({
    success: true,
    message: 'Alimento creado correctamente.',
    data: {
      id: Number(result.lastInsertRowid),
      nombre,
      calorias,
      proteina,
      carbohidratos,
      grasa,
    },
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
