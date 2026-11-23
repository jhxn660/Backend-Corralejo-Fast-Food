/**
 * Traduce los errores de Mongoose/MongoDB a un objeto plano { campo: mensaje }.
 * Lo usa el errorHandler central; devuelve null si el error no es de persistencia
 * (entonces se trata como 500).
 */
const handleMongooseError = ( error ) => {
    // 1. Validación del Schema (required, minlength, enum, match, validadores propios...).
    //    error.errors trae un objeto por cada campo que falló.
    if ( error.name === 'ValidationError' ) {
        return Object.fromEntries(
            Object.entries( error.errors ).map( ( [ field, detail ] ) => [ field, detail.message ] )
        );
    }

    // 2. Índice único violado (código 11000 del driver). OJO: `unique` en el Schema NO es un
    //    validador de Mongoose; quien rechaza el duplicado es el índice en MongoDB, por eso
    //    llega aquí y no como ValidationError, y sin el mensaje personalizado del Schema.
    //    Se exige keyValue: un duplicado dentro de una escritura masiva (bulkWrite) no lo trae,
    //    y leerlo sin comprobar lanzaba un TypeError dentro del propio manejador de errores.
    if ( error.code === 11000 && error.keyValue ) {
        const field = Object.keys( error.keyValue )[0];

        return {
            [field]: `El campo '${field}' con el valor '${error.keyValue[field]}' ya se encuentra registrado.`
        };
    }

    // 3. Valor imposible de convertir al tipo del Schema; el caso típico es un :id que no es ObjectId.
    if ( error.name === 'CastError' ) {
        const value = typeof error.value === 'object' ? JSON.stringify( error.value ) : String( error.value );

        return error.kind === 'ObjectId'
            ? {
                msg: `El ID debe tener 24 caracteres hexadecimales y el enviado tiene ${value.length}`,
                [error.path]: `El identificador '${value}' no tiene un formato válido de MongoDB`
            }
            : { [error.path]: `El valor '${value}' no es válido para el campo '${error.path}'` };
    }

    return null;
};

export default handleMongooseError;
