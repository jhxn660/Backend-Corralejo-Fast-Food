import { validateToken } from '../helpers/jwt.helper.js';
import { dbGetActiveUserById } from '../services/users.services.js';

// El token viaja en X-Token; también se acepta el estándar `Authorization: Bearer <token>`.
const extractToken = (req) => {
    const bearer = /^Bearer\s+(.+)$/i.exec(req.header('Authorization') ?? '');

    return req.header('X-Token') || bearer?.[1] || null;
};

const reject = (res, msg) => res.status(401).json({ msg });

/**
 * Autenticación: ¿quién hace la petición?
 * 1. Lee el token de la cabecera.
 * 2. Comprueba firma y expiración (sin tocar la BD).
 * 3. Busca al usuario en la BD. Por esto un usuario eliminado o con state=false queda fuera
 *    al instante, aunque su token siga sin vencer: el JWT solo dice quién era al firmarse.
 * 4. Deja el usuario (sin contraseña) en req.userFound para autorización y controladores.
 * Todo rechazo es 401; "no tienes permiso" (403) es asunto de authorizationMiddleware.
 */
const authMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (!token) return reject(res, 'Cadena de token vacia');

        // header.payload.firma: descarta basura sin gastar una verificación criptográfica
        if (token.split('.').length !== 3) return reject(res, 'Formato del token no es valido');

        const payload = validateToken(token);

        if (!payload) return reject(res, 'Token invalido o inactivo');

        const userFound = await dbGetActiveUserById(payload._id);

        if (!userFound) {
            return reject(res, 'El usuario esta deshabilitado o ya no se encuentra registrado en el sistema');
        }

        req.userFound = userFound;

        next();
    } catch (error) {
        // Un _id de payload corrupto o la BD caída: se rechaza en vez de dejar pasar
        console.error(error);

        return reject(res, 'No se pudo verificar la autenticacion del token');
    }
};

/**
 * Variante para rutas que admiten visitantes sin cuenta (rol 'Usuario').
 * Sin token la petición sigue como anónima (req.userFound queda undefined); si el token viene,
 * se valida igual que en authMiddleware y uno inválido SÍ responde 401 (no se degrada a anónimo).
 */
const optionalAuthMiddleware = (req, res, next) => {
    if (!extractToken(req)) return next();

    return authMiddleware(req, res, next);
};

export {
    authMiddleware,
    optionalAuthMiddleware
};
