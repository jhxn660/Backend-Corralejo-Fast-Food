import jwt from 'jsonwebtoken';

const TOKEN_TTL = '1h';

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
