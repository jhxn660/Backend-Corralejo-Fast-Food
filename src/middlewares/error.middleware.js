import handleMongooseError from '../helpers/handle-mongoose-error.helper.js';
import { HttpError } from '../helpers/http-error.helper.js';

// Va después de todas las rutas: si la petición llegó hasta aquí, ninguna ruta coincidió.
const notFoundHandler = (req, res) => {
    res.status(404).json({ msg: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

/**
 * Manejo centralizado de errores: el ÚNICO punto donde un error se convierte en respuesta HTTP.
 * Express lo reconoce como manejador de errores porque recibe cuatro parámetros (error, req, res, next).
 *
 * Cómo llega un error hasta aquí: un servicio o controlador lanza (throw) → asyncHandler lo
 * atrapa y llama a next(error) → Express se salta el resto de middlewares y ejecuta este.
 * Por eso ningún controlador tiene try/catch propio ni decide códigos de error por su cuenta.
 *
 * El orden de las comprobaciones va del error más específico al más general.
 */
const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error instanceof HttpError) {
        return res.status(error.status).json({ msg: error.message, ...error.details });
    }

    // optimisticConcurrency: el documento cambió entre la lectura y el save()
    if (error.name === 'VersionError') {
        return res.status(409).json({ msg: 'El registro cambió mientras se editaba. Vuelve a cargarlo e inténtalo de nuevo' });
    }

    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ msg: 'El cuerpo de la petición no es un JSON válido' });
    }

    // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
    const validationErrors = handleMongooseError(error);
    if (validationErrors) {
        return res.status(400).json(validationErrors);
    }

    console.error(error);

    res.status(500).json({ msg: error.fallbackMessage ?? 'Error interno del servidor' });
};

export { notFoundHandler, errorHandler };
