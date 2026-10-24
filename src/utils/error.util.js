// Devuelve errores con el mismo formato en toda la aplicación.
export function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}
