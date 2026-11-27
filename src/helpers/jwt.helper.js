import jwt from 'jsonwebtoken';

// La sesión dura 2 horas. El frontend pide un token nuevo después de cada petición al backend;
// sin peticiones durante 2 horas, el token vence y la sesión se cierra.
const TOKEN_TTL = '2h';

/**
 * Firma un token HS256 con JWT_SECRET. El payload NO va cifrado (es Base64): cualquiera puede
 * leerlo, nadie puede alterarlo sin el secreto. No guardar en él nada sensible.
 * Devuelve null si falla la firma (normalmente: JWT_SECRET sin definir).
 */
const generateToken = ( payload ) => {
    try {
        return jwt.sign( payload, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL } );
    } catch (error) {
        console.error( error );

        return null;
    }
};

/**
 * Verifica firma y expiración. Devuelve el payload o null. Un token inválido o vencido es un
 * caso normal (no un fallo del servidor), por eso no se registra en consola.
 */
const validateToken = ( token ) => {
    try {
        return jwt.verify( token, process.env.JWT_SECRET );
    } catch {
        return null;
    }
};

export {
    generateToken,
    validateToken
};
