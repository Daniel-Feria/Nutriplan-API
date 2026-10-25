import express from 'express';
import cors from 'cors';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.routes.js';
import alimentosRoutes from './routes/alimentos.routes.js';
import comidasRoutes from './routes/comidas.routes.js';
import resumenRoutes from './routes/resumen.routes.js';
import webRoutes from './routes/web.routes.js';

const app = express();
const currentDirectory = dirname(fileURLToPath(import.meta.url));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('views', join(currentDirectory, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(join(currentDirectory, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/alimentos', alimentosRoutes);
app.use('/api/comidas', comidasRoutes);
app.use('/api/resumen', resumenRoutes);
app.use(webRoutes);

export default app;
