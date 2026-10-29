import { generateToken, validateToken } from "../helpers/jwt.helpers.js";
import { dbGetUserByEmail } from "../services/usuarios.services.js";

const authMiddleware = async (req, res, next) => {
    try {
        // Paso 1: Obtener el token de la cabecera
        const token = req.header('X-Token');

        console.log('token: ', token);

        // 2.1: Verifica que haya recibido una cadena (Token)... En Teoria pero es una cadena
        if (!token) {
            return res.status(401).json({
                msg: 'Cadena de token vacia'
            });
        }

        // 2.2: Divide la cadena en partes usando el (.) como referencia
        const tokenParts = token.split('.');
        // console.log ( 'Token parts: ', tokenParts );

        // 2.3 Verificar que la cadena tenga 3 partes separadas por puntos (Forma base de un token) 1parte.2segunda.3tercera
        if (tokenParts.length !== 3) {
            return res.json({
                msg: 'Formato del token no es valido'
            });
        }

        // 2.4: Verificar la autenticidad del token (si fue generado por jwt de esta aplicación)
        const payload = validateToken(token);

        if (!payload) {
            return res.json({
                msg: 'Token invalido o inativo'
            });
        }

        console.log('payload (middleware): ', payload);

        // Paso 3: Verificar si el usuario existe en la base de datos (true)
        // ( si el usuario fue eliminado o su estado)
        const userFound = await dbGetUserByEmail(payload.email);

        if (!userFound) {
            return res.json({
                msg: 'El usuario esta deshabilitado o ya no se encuentra registrado en el sistema'
            });
        }

        console.log('userFound', userFound);

        // Deja el usuario en la request para que el controlador lo lea con req.userFound
        req.userFound = userFound;

        next();

    } catch (error) {
        // Se responde con un JSON en lugar de terminar en el error genérico de Express
        console.error(error);

        return res.status(401).json({
            msg: 'No se pudo verificar la autenticacion del token'
        });
    }
}

export {
    authMiddleware
}