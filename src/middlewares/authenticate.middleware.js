import { validateToken } from '../helpers/jwt.helpers.js';
import { dbGetUserByEmail } from '../services/users.services.js';

// CAMBIO: todo rechazo de este middleware responde 401; antes el token mal formado, el token
// inválido y el usuario deshabilitado salían con 200 y el cliente no podía distinguirlos de un éxito.
const authMiddleware = async (req, res, next) => {
    try {
        // Paso 1: Obtener el token de la cabecera
        const token = req.header('X-Token');

        // 2.1: Verifica que haya recibido una cadena (Token)
        if (!token) {
            return res.status(401).json({
                msg: 'Cadena de token vacia'
            });
        }

        // 2.2: Divide la cadena en partes usando el (.) como referencia
        const tokenParts = token.split('.');

        // 2.3: Verificar que la cadena tenga 3 partes separadas por puntos
        // (forma base de un token) 1parte.2segunda.3tercera
        if (tokenParts.length !== 3) {
            return res.status(401).json({
                msg: 'Formato del token no es valido'
            });
        }

        // 2.4: Verificar la autenticidad del token
        // (si fue generado por el jwt de esta aplicacion)
        const payload = validateToken(token);

        if (!payload) {
            return res.status(401).json({
                msg: 'Token invalido o inactivo'
            });
        }

        // Paso 3: Verificar si el usuario existe en la base de datos
        // (si el usuario fue eliminado o cambio su estado)
        const userFound = await dbGetUserByEmail(payload.email);

        if (!userFound) {
            return res.status(401).json({
                msg: 'El usuario esta deshabilitado o ya no se encuentra registrado en el sistema'
            });
        }

        // Deja el usuario en la request para que el controlador lo lea con req.userFound
        req.userFound = userFound;

        next();

    } catch (error) {
        // Se responde con un JSON en lugar de terminar en el error generico de Express
        console.error(error);

        return res.status(401).json({
            msg: 'No se pudo verificar la autenticacion del token'
        });
    }
};

// CAMBIO: variante para rutas que admiten visitantes sin cuenta (rol 'Usuario').
// Sin token la petición continúa como anónima (req.userFound queda undefined); si el token
// viene, se valida con las mismas reglas que authMiddleware y un token inválido sí responde 401.
const optionalAuthMiddleware = (req, res, next) => {
    if (!req.header('X-Token')) {
        return next();
    }

    return authMiddleware(req, res, next);
};

export {
    authMiddleware,
    optionalAuthMiddleware
};
