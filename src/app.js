import express from 'express';
import authRoutes from './routes/auth.routes.js';
import alimentosRoutes from './routes/alimentos.routes.js';
import comidasRoutes from './routes/comidas.routes.js';
import resumenRoutes from './routes/resumen.routes.js';

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/alimentos', alimentosRoutes);
app.use('/api/comidas', comidasRoutes);
app.use('/api/resumen', resumenRoutes);

export default app;
