/**
 * Envuelve un controlador async y delega cualquier excepción al errorHandler central.
 *
 * @param {Function} handler - Controlador (req, res, next)
 * @param {string} [fallbackMessage] - Mensaje del 500 cuando el error no es reconocido
 */
const asyncHandler = (handler, fallbackMessage) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        error.fallbackMessage ??= fallbackMessage;
        next(error);
    }
};

export default asyncHandler;
