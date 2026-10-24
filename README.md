# Nutriplan API

API REST para una aplicación de planificación nutricional. El proyecto está en una etapa inicial de desarrollo.

## Estado actual

El repositorio contiene la estructura base de una API en Node.js y Express, junto con módulos previstos para autenticación, alimentos, comidas y resúmenes. Por ahora, esos módulos y el punto de entrada son archivos sin implementar; la API todavía no expone endpoints ni inicia un servidor.

## Tecnologías

- Node.js y Express
- SQLite
- JWT y bcryptjs
- Zod para validar entradas
- dotenv y cors

## Preparar el proyecto

Requiere Node.js y npm. Instala las dependencias con:

```bash
npm install
```

Puedes copiar `.env.example` como `.env` y configurar sus valores para el entorno local. Usa un secreto propio para `JWT_SECRET`; no publiques credenciales.

## Comandos disponibles

```bash
npm run dev  # Ejecuta el punto de entrada con nodemon
npm start    # Ejecuta el punto de entrada con Node.js
npm run db:init  # Crea las tablas de la base de datos
npm run db:seed  # Inserta 50 alimentos si la tabla alimentos está vacía
```

Los comandos `dev` y `start` aún no inician un servidor porque `src/index.js` está pendiente de implementación.

La carga inicial de alimentos usa valores nutricionales aproximados por cada 100 g, definidos en `src/database/alimentos-base.json` (campos: `nombre`, `calorias`, `proteina`, `carbohidratos` y `grasa`). Puedes editar ese archivo para modificar los alimentos base. Configura `DB_FILE` en `.env` para elegir la base de datos. Ejecuta primero `npm run db:init` y luego `npm run db:seed`; el segundo comando no realiza cambios si la tabla `alimentos` ya contiene registros.

## Validación de entradas

Usa `validateRequest` de `src/middlewares/validate.middleware.js` con un esquema Zod. El origen predeterminado es `body`; también puedes validar `params` o `query`. Los datos parseados y validados quedan disponibles en `req.validated` bajo ese origen.

```js
import { z } from 'zod';
import { validateRequest } from '../middlewares/validate.middleware.js';

const userSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

router.post('/users', validateRequest(userSchema), (req, res) => {
  const { email, password } = req.validated.body;
  // Crear usuario...
});

router.get('/users/:id', validateRequest(z.object({
  id: z.string().uuid(),
}), 'params'), handler);
```

Cuando la entrada no cumple el esquema, responde con estado `400`, un mensaje y los errores con sus rutas:

```json
{
  "success": false,
  "message": "Datos de entrada inválidos.",
  "errors": [{ "path": ["email"], "message": "Invalid email address" }]
}
```

## Respuestas de error

Usa `sendError` de `src/utils/error.util.js` para responder errores con el mismo formato:

```json
{
  "success": false,
  "message": "Alimento no encontrado."
}
```

```js
import { sendError } from '../utils/error.util.js';

return sendError(res, 404, 'Alimento no encontrado.');
```