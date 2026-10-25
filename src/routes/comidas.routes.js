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
const comidasQuerySchema = z.object({
  fecha: z.iso.date(),
});
const comidaParamsSchema = z.object({
  id: z.string()
    .regex(/^[1-9]\d*$/, 'El ID debe ser un entero positivo.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'El ID debe ser un entero válido.'),
});

// Lista las comidas del usuario para la fecha indicada.
router.get(
  '/',
  authMiddleware,
  validateRequest(comidasQuerySchema, 'query'),
  (req, res) => {
    const { fecha } = req.validated.query;
    // Filtra por usuario para no mostrar comidas de otras cuentas.
    const comidas = db.prepare(`
      SELECT id, usuario_id, alimento_id, gramos, fecha, tipo
      FROM comidas
      WHERE usuario_id = ? AND fecha = ?
      ORDER BY id
    `).all(req.user.id, fecha);

    return res.json({
      success: true,
      message: 'Comidas obtenidas correctamente.',
      data: comidas,
    });
  },
);

// Registra una comida para el usuario autenticado.
router.post('/', authMiddleware, validateRequest(comidaSchema), (req, res) => {
  const { alimento_id, gramos, fecha, tipo } = req.validated.body;
  const alimento = db.prepare('SELECT id FROM alimentos WHERE id = ?').get(alimento_id);

  // Evita guardar una comida con un alimento inexistente.
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

// Elimina una comida solo si pertenece al usuario autenticado.
router.delete(
  '/:id',
  authMiddleware,
  validateRequest(comidaParamsSchema, 'params'),
  (req, res) => {
    const { id } = req.validated.params;
    const resultado = db.transaction(() => {
      const comida = db.prepare('SELECT usuario_id FROM comidas WHERE id = ?').get(id);

      if (!comida) {
        return 'no_encontrada';
      }

      if (comida.usuario_id !== req.user.id) {
        return 'sin_permiso';
      }

      db.prepare('DELETE FROM comidas WHERE id = ? AND usuario_id = ?')
        .run(id, req.user.id);

      return 'eliminada';
    })();

    if (resultado === 'no_encontrada') {
      return sendError(res, 404, 'Comida no encontrada.');
    }

    if (resultado === 'sin_permiso') {
      return sendError(res, 403, 'No tienes permiso para eliminar esta comida.');
    }

    return res.json({
      success: true,
      message: 'Comida eliminada correctamente.',
      data: { id },
    });
  },
);

export default router;