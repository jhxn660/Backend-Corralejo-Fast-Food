/**
 * Helper para formatear y estructurar las excepciones arrojadas por Mongoose
 * Transforma los errores en un objeto plano donde:
 *   - Llave: Nombre de la propiedad que falló la validación
 *   - Valor: Mensaje de error configurado en el Schema de Mongoose
 * 
 * Es una función genérica y reutilizable para cualquier modelo o entidad de la aplicación.
 * 
 * @param {Error} error - Objeto de excepción capturado en el bloque catch del controlador
 * @returns {Object|null} Objeto { [propiedad]: mensajeDeError } o null si no es un error reconocido de Mongoose
 */
const handleMongooseError = ( error ) => {
    // 1. Error de validación de Schema (required, minlength, maxlength, match, enum, etc.)
    if ( error.name === 'ValidationError' ) {
        const errors = {};

        // error.errors contiene un objeto por cada propiedad que no cumplió las reglas del Schema
        for ( const field in error.errors ) {
            // Asigna como llave el nombre del campo y como valor el mensaje de error definido
            errors[field] = error.errors[field].message;
        }

        return errors;
    }

    // 2. Error de clave única duplicada en MongoDB (código 11000, ej: email o name ya existente)
    if ( error.code === 11000 ) {
        const field = Object.keys( error.keyValue )[0];
        return {
            [field]: `El ${field} '${error.keyValue[field]}' ya se encuentra registrado`
        };
    }

    // 3. Error de CastError (cuando se pasa un ID que no cumple el formato ObjectId de Mongo)
    if ( error.name === 'CastError' ) {
        return {
            [error.path]: `El identificador '${error.value}' no tiene un formato válido de MongoDB`
        };
    }

    return null;
};

export default handleMongooseError;