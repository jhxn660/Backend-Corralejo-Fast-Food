import handleMongooseError from '../helpers/handle-mongoose-error.helper.js';
import { HttpError } from '../helpers/http-error.helper.js';

// Express 5 deja req.body en undefined cuando la petición no trae cuerpo JSON.
const ensureBody = (req, res, next) => {
    req.body ??= {};
    next();
};

const notFoundHandler = (req, res) => {
    res.status(404).json({ msg: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

// Único punto donde un error se convierte en respuesta HTTP.
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

export { ensureBody, notFoundHandler, errorHandler };
