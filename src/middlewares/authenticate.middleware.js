import { generateToken, validateToken } from "../helpers/jwt.helpers.js";
import { dbGetUserByEmail } from "../services/users.services.js";

const authMiddleware = async ( req, res, next ) => {
    const token = req.header( 'X-Token' );

    const msg = 'Hola soy el middleware de autenticacion';
    console.log( 'token', token );

    // Verifica que hayan recibido una cadena
    if( ! token ) {
        res.status( 401).json({
            msg: 'Cadena de token vacia'
        });
    }

    // Verificar que la cadena tenga  partes separadas por puntos
    const tokenParts = token.split( '.' );
    // console.log( 'Token Parts: ', tokenParts)

    // Verificar que la cadena tenga 3 partes separadas por puntos
    if( tokenParts.length !==3) {
        res.json({
            msg: 'Formato del token no es valido'
        });
    }

    // Verificar la utenticidad del token
    const payload = validateToken(token);

    if( ! payload ) {
        res.json({
            msg: 'Token invalid o inactivo'
        });
    }

    console.log( 'payload (middleware): ', payload);

    // Verificar que el usuario exista en la base de datos
    const userFound = await dbGetUserByEmail(payload.email);

    if( ! userFound ) {
        res.json({
            msg: 'El usuario esta deshabilitado o no registrado. No es posible generar Token'
        });
    }

    res.holaatodos = 'Hola Terricolas'

    console.log( 'userFound', userFound);


    next();
}

export {
    authMiddleware
}