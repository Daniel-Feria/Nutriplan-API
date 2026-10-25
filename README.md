# Nutriplan API

API REST para una aplicación de planificación nutricional.

## Estado actual

La API incluye endpoints de registro e inicio de sesión, consulta y gestión de alimentos, y creación de comidas. El módulo de resúmenes todavía está pendiente.

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

La API escucha en el puerto definido por `PORT` (3000 por defecto). La base de datos debe inicializarse con `npm run db:init` antes de arrancarla.

## Autenticación

Todos los endpoints de autenticación usan el prefijo `/api/auth`. Las contraseñas deben tener al menos 8 caracteres y se almacenan con bcrypt; las respuestas nunca incluyen el hash. Los tokens JWT expiran en siete días.

### `POST /api/auth/register`

Registra una cuenta con `nombre`, `email` y `password`:

```json
{
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "password": "una-clave-segura"
}
```

Responde con estado `201` y devuelve el usuario público junto con un token JWT. El email se almacena normalizado en minúsculas; si ya existe, responde `409`.

### `POST /api/auth/login`

Acepta `email` y `password`, y devuelve el usuario público junto con un token JWT. Las credenciales incorrectas responden `401`; los datos inválidos responden `400` con el formato de validación descrito abajo.

## Alimentos

### `GET /api/alimentos`

Endpoint público que devuelve los alimentos ordenados por nombre. Acepta el filtro opcional `nombre` para buscar coincidencias parciales, sin distinguir mayúsculas y minúsculas:

```text
GET /api/alimentos?nombre=manzana
```

Si se omite `nombre` o se envía vacío, devuelve todos los alimentos. La respuesta contiene `id`, `nombre`, `calorias`, `proteina`, `carbohidratos` y `grasa` por cada alimento:

```json
{
  "success": true,
  "message": "Alimentos obtenidos correctamente.",
  "data": [
    {
      "id": 1,
      "nombre": "Manzana",
      "calorias": 52,
      "proteina": 0.3,
      "carbohidratos": 13.8,
      "grasa": 0.2
    }
  ]
}
```

### `GET /api/alimentos/:id`

Endpoint público que devuelve un alimento por su ID. Si el ID no corresponde a un alimento existente, responde `404`:

```json
{
  "success": true,
  "message": "Alimento obtenido correctamente.",
  "data": {
    "id": 1,
    "nombre": "Manzana",
    "calorias": 52,
    "proteina": 0.3,
    "carbohidratos": 13.8,
    "grasa": 0.2
  }
}
```

### `POST /api/alimentos`

Endpoint protegido: requiere un token JWT en `Authorization: Bearer <token>`. Recibe el nombre y los valores nutricionales por cada 100 g; los valores numéricos deben ser mayores o iguales a cero:

```json
{
  "nombre": "Manzana",
  "calorias": 52,
  "proteina": 0.3,
  "carbohidratos": 13.8,
  "grasa": 0.2
}
```

Responde con estado `201` y el alimento creado.

### `PUT /api/alimentos/:id`

Endpoint protegido: requiere un token JWT en `Authorization: Bearer <token>`. Actualiza el alimento existente con el mismo formato de datos y validaciones que `POST /api/alimentos`; todos los campos son requeridos y los valores nutricionales deben ser mayores o iguales a cero. Si no existe un alimento con ese ID, responde `404`.

### `DELETE /api/alimentos/:id`

Endpoint protegido: requiere un token JWT en `Authorization: Bearer <token>`. Elimina el alimento indicado por ID y responde `404` si no existe. Si el alimento ya está asociado a una comida, responde `409` y no lo elimina.

La carga inicial de alimentos usa valores nutricionales aproximados por cada 100 g, definidos en `src/database/alimentos-base.json` (campos: `nombre`, `calorias`, `proteina`, `carbohidratos` y `grasa`). Puedes editar ese archivo para modificar los alimentos base. Configura `DB_FILE` en `.env` para elegir la base de datos. Ejecuta primero `npm run db:init` y luego `npm run db:seed`; el segundo comando no realiza cambios si la tabla `alimentos` ya contiene registros.

## Comidas

### `GET /api/comidas?fecha=AAAA-MM-DD`

Endpoint protegido: requiere un token JWT en `Authorization: Bearer <token>`. Devuelve las comidas de la fecha indicada que pertenecen al usuario autenticado; nunca incluye comidas de otros usuarios. Si la fecha no tiene comidas, devuelve una lista vacía. La fecha debe usar el formato `AAAA-MM-DD`.

### `POST /api/comidas`

Endpoint protegido: requiere un token JWT en `Authorization: Bearer <token>`. Crea una comida para el usuario autenticado. `alimento_id` debe identificar un alimento existente, `gramos` debe ser mayor que cero, `fecha` debe usar el formato `AAAA-MM-DD` y `tipo` debe ser `desayuno`, `almuerzo`, `cena` o `snack`:

```json
{
  "alimento_id": 1,
  "gramos": 150,
  "fecha": "2026-10-24",
  "tipo": "desayuno"
}
```

Responde con estado `201` y los datos de la comida creada. Los datos inválidos responden `400`, y un `alimento_id` inexistente responde `404`.

### `DELETE /api/comidas/:id`

Endpoint protegido: requiere un token JWT en `Authorization: Bearer <token>`. Elimina la comida solo si pertenece al usuario autenticado. Responde `404` si no existe y `403` si pertenece a otro usuario.

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