import { Router } from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { sendError } from '../utils/error.util.js';

const router = Router();
const comidaSchema = z.object({
  alimento_id: z.number().int().positive('El ID del alimento debe ser un entero positivo.'),
  gramos: z.number().positive('Los gramos deben ser mayores que 0.'),
  fecha: z.iso.date(),
  tipo: z.enum(['desayuno', 'almuerzo', 'cena', 'snack']),
});

router.post('/', authMiddleware, validateRequest(comidaSchema), (req, res) => {
  const { alimento_id, gramos, fecha, tipo } = req.validated.body;
  const alimento = db.prepare('SELECT id FROM alimentos WHERE id = ?').get(alimento_id);

  if (!alimento) {
    return sendError(res, 404, 'Alimento no encontrado.');
  }

  const result = db.prepare(`
    INSERT INTO comidas (usuario_id, alimento_id, gramos, fecha, tipo)
    VALUES (@usuario_id, @alimento_id, @gramos, @fecha, @tipo)
  `).run({
    usuario_id: req.user.id,
    alimento_id,
    gramos,
    fecha,
    tipo,
  });

  return res.status(201).json({
    success: true,
    message: 'Comida creada correctamente.',
    data: {
      id: Number(result.lastInsertRowid),
      usuario_id: req.user.id,
      alimento_id,
      gramos,
      fecha,
      tipo,
    },
  });
});

export default router;