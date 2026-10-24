# Nutriplan API

API REST para una aplicación de planificación nutricional. El proyecto está en una etapa inicial de desarrollo.

## Estado actual

El repositorio contiene la estructura base de una API en Node.js y Express, junto con módulos previstos para autenticación, alimentos, comidas y resúmenes. Por ahora, esos módulos y el punto de entrada son archivos sin implementar; la API todavía no expone endpoints ni inicia un servidor.

## Tecnologías

- Node.js y Express
- SQLite
- JWT y bcryptjs
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
```

Estos comandos están definidos, pero aún no inician un servidor porque `src/index.js` está pendiente de implementación.