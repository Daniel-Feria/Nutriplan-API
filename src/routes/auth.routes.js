import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../config/db.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { sendError } from '../utils/error.util.js';

const router = Router();
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .refine(
      (password) => Buffer.byteLength(password, 'utf8') <= 72,
      'La contraseña no puede superar los 72 bytes.',
    ),
});
const registerSchema = credentialsSchema.extend({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(100),
});

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('La variable de entorno JWT_SECRET no está definida.');
  }

  return secret;
}

function createToken(user, secret) {
  return jwt.sign(
    { id: user.id, nombre: user.nombre, email: user.email },
    secret,
    { expiresIn: '1h' },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
  };
}

router.post('/register', validateRequest(registerSchema), async (req, res) => {
  const { nombre, email, password } = req.validated.body;
  const secret = getJwtSecret();
  const existingUser = db.prepare(
    'SELECT id FROM usuarios WHERE LOWER(email) = ?',
  ).get(email);

  if (existingUser) {
    return sendError(res, 409, 'Ya existe una cuenta con ese correo electrónico.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = db.prepare(`
      INSERT INTO usuarios (nombre, email, password_hash)
      VALUES (?, ?, ?)
    `).run(nombre, email, passwordHash);

    const user = { id: Number(result.lastInsertRowid), nombre, email };

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente.',
      data: {
        user,
        token: createToken(user, secret),
      },
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return sendError(res, 409, 'Ya existe una cuenta con ese correo electrónico.');
    }

    throw error;
  }
});

router.post('/login', validateRequest(credentialsSchema), async (req, res) => {
  const { email, password } = req.validated.body;
  const secret = getJwtSecret();
  const user = db.prepare(`
    SELECT id, nombre, email, password_hash
    FROM usuarios
    WHERE LOWER(email) = ?
  `).get(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return sendError(res, 401, 'Correo electrónico o contraseña incorrectos.');
  }

  const safeUser = publicUser(user);

  return res.json({
    success: true,
    message: 'Inicio de sesión exitoso.',
    data: {
      user: safeUser,
      token: createToken(safeUser, secret),
    },
  });
});

export default router;
