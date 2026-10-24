const REQUEST_SOURCES = new Set(['body', 'params', 'query']);

export function validateRequest(schema, source = 'body') {
  if (!REQUEST_SOURCES.has(source)) {
    throw new TypeError(`Origen de validación no válido: ${source}`);
  }

  return async function validationMiddleware(req, res, next) {
    const result = await schema.safeParseAsync(req[source]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos.',
        errors: result.error.issues.map(({ path, message }) => ({
          path,
          message,
        })),
      });
    }

    req.validated = {
      ...req.validated,
      [source]: result.data,
    };

    return next();
  };
}

export default validateRequest;
