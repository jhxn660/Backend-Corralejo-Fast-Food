/**
 * Error de negocio con código HTTP. Servicios y controladores lo lanzan y el
 * errorHandler central lo convierte en respuesta: así ningún handler repite try/catch.
 */
class HttpError extends Error {
    /**
     * @param {number} status - Código HTTP de la respuesta
     * @param {string} message - Texto que viaja en `msg`
     * @param {Object} [details] - Campos adicionales del cuerpo de la respuesta
     */
    constructor(status, message, details = {}) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.details = details;
    }
}

// Mongoose devuelve null (no lanza) cuando el ID no existe: se traduce a 404.
const assertFound = (data, message) => {
    if (!data) throw new HttpError(404, message);

    return data;
};

export { HttpError, assertFound };
