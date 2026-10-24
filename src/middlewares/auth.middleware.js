import 'dotenv/config'; // Para manejo de variables de entorno
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/error.util.js';

export function authMiddleware(req, res, next) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('La variable de entorno JWT_SECRET no está definida.');
  }

  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return sendError(res, 401, 'Token de autenticación no proporcionado o inválido.');
  }

  try {
    const payload = jwt.verify(match[1], secret);

    if (typeof payload !== 'object' || payload === null) {
      return sendError(res, 401, 'Token de autenticación no proporcionado o inválido.');
    }

    req.user = payload;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return sendError(res, 401, 'Token de autenticación no proporcionado o inválido.');
    }

    throw error;
  }
}

export default authMiddleware;
