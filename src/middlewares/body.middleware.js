/**
 * Middlewares que preparan `req.body` ANTES de que llegue a cualquier ruta.
 * Se registran en app.js justo después de express.json(), así que protegen a toda la API
 * sin que cada controlador tenga que acordarse de hacerlo.
 */

// Express 5 deja req.body en undefined cuando la petición no trae cuerpo JSON.
// Con {} los controladores pueden desestructurar el body sin comprobar si existe.
const ensureBody = (req, res, next) => {
    req.body ??= {};
    next();
};

/**
 * Rechaza los cuerpos que traen operadores de MongoDB como campos ("$set", "$inc", "$unset"...).
 *
 * POR QUÉ: los servicios actualizan con findOneAndUpdate(filtro, body). Mongoose trata toda clave
 * del body que empieza por "$" como una orden de actualización, no como un dato. Los controladores
 * quitan los campos protegidos por su nombre (`role`, `password`, `isActive`...), pero
 * { "$set": { "role": "Owner" } } no tiene ningún campo llamado `role` en el primer nivel:
 * pasaba el filtro y Mongoose lo aplicaba. Un Cliente recién registrado podía volverse Owner.
 *
 * Ningún campo legítimo de la API empieza por "$", así que se corta aquí, en un único punto.
 * Los operadores ANIDADOS (p. ej. { "email": { "$ne": null } }) son otro ataque, contra los
 * filtros de búsqueda: esos los rechaza cada controlador al exigir que el valor sea un string.
 */
const rejectMongoOperators = (req, res, next) => {
    const operator = Object.keys(req.body).find((key) => key.startsWith('$'));

    if (operator) {
        return res.status(400).json({ msg: `El campo '${operator}' no está permitido en el cuerpo de la petición` });
    }

    next();
};

export { ensureBody, rejectMongoOperators };
