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
        // keyValue muestra el item repetido con el parametro sin Object.keys
        // Object.keys( error.keyValue ) muestra solamente la variable
        const field = Object.keys( error.keyValue )[0];
        return {
            [field]: `El campo ${field}' con el valor ${error.keyValue[field]}', ya se encuentra registrado.`
        };
    }

    // 3. Error de CastError (cuando se pasa un ID que no cumple el formato ObjectId de Mongo)
    if ( error.name === 'CastError' ) {
        return {
            msg: `El ID debe tener 24 caracteres y el enviado tiene ${error.value.length}`,
            [error.path]: `El identificador '${error.value}' no tiene un formato válido de MongoDB`
        };
    }

    return null;
};

/**
 * Campos obligatorios por entidad.
 * Reemplaza a los antiguos comments.helpers, pqrs.helpers y establecimiento.helpers,
 * que repetían la misma comprobación con un `if` distinto por entidad.
 */
const REQUIRED_FIELDS = {
    comment: [ 'codigo', 'comentario' ],
    pqrs: [ 'tipo', 'asunto', 'descripcion' ],
    establecimiento: [ 'titulo', 'contenido' ],
    horario: [ 'dia', 'apertura', 'cierre' ],
    ubicacion: [ 'direccion', 'ciudad' ]
};

/**
 * Valida la presencia de los campos obligatorios de una entidad antes de llegar a la base de datos.
 * Lanza un error con la misma forma que el ValidationError de Mongoose, de modo que
 * handleMongooseError lo formatea igual que cualquier otro error de persistencia.
 *
 * @param {keyof REQUIRED_FIELDS} entity - Clave de la entidad en REQUIRED_FIELDS
 * @param {Object} data - Datos de entrada (normalmente req.body)
 * @throws {Error} ValidationError con un mensaje por cada campo faltante
 */
const validateRequiredFields = ( entity, data = {} ) => {
    const missing = ( REQUIRED_FIELDS[entity] ?? [] ).filter( ( field ) => !data[field] );

    if ( missing.length === 0 ) return;

    const error = new Error( `Campos obligatorios faltantes: ${missing.join( ', ' )}` );
    error.name = 'ValidationError';
    error.errors = Object.fromEntries(
        missing.map( ( field ) => [ field, { message: `El campo '${field}' es obligatorio` } ] )
    );

    throw error;
};

export { REQUIRED_FIELDS, validateRequiredFields };
export default handleMongooseError;
