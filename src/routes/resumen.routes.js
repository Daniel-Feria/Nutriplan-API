import { Router } from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';

const router = Router();
const resumenQuerySchema = z.object({
  fecha: z.iso.date(),
});
const redondearNutriente = (valor) => Number(valor.toFixed(2));

router.get(
  '/',
  authMiddleware,
  validateRequest(resumenQuerySchema, 'query'),
  (req, res) => {
    const { fecha } = req.validated.query;
    const comidas = db.prepare(`
      SELECT
        c.id,
        c.tipo,
        c.gramos,
        a.id AS alimento_id,
        a.nombre AS alimento_nombre,
        a.calorias * c.gramos / 100 AS calorias,
        a.proteina * c.gramos / 100 AS proteina,
        a.carbohidratos * c.gramos / 100 AS carbohidratos,
        a.grasa * c.gramos / 100 AS grasa
      FROM comidas c
      JOIN alimentos a ON a.id = c.alimento_id
      WHERE c.usuario_id = ? AND c.fecha = ?
      ORDER BY c.id
    `).all(req.user.id, fecha);

    const comidasDetalladas = comidas.map((comida) => ({
      id: comida.id,
      tipo: comida.tipo,
      gramos: comida.gramos,
      alimento: {
        id: comida.alimento_id,
        nombre: comida.alimento_nombre,
      },
      nutrientes: {
        calorias: redondearNutriente(comida.calorias),
        proteina: redondearNutriente(comida.proteina),
        carbohidratos: redondearNutriente(comida.carbohidratos),
        grasa: redondearNutriente(comida.grasa),
      },
    }));

    const totalesSinRedondear = comidasDetalladas.reduce((acumulado, comida) => ({
      calorias: acumulado.calorias + comida.nutrientes.calorias,
      proteina: acumulado.proteina + comida.nutrientes.proteina,
      carbohidratos: acumulado.carbohidratos + comida.nutrientes.carbohidratos,
      grasa: acumulado.grasa + comida.nutrientes.grasa,
    }), {
      calorias: 0,
      proteina: 0,
      carbohidratos: 0,
      grasa: 0,
    });
    const totales = {
      calorias: redondearNutriente(totalesSinRedondear.calorias),
      proteina: redondearNutriente(totalesSinRedondear.proteina),
      carbohidratos: redondearNutriente(totalesSinRedondear.carbohidratos),
      grasa: redondearNutriente(totalesSinRedondear.grasa),
    };

    return res.json({
      success: true,
      message: 'Resumen nutricional obtenido correctamente.',
      data: {
        fecha,
        comidas: comidasDetalladas,
        totales,
      },
    });
  },
);

export default router;