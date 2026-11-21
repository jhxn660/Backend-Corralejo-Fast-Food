import { authMiddleware } from './authenticate.middleware.js';

/**
 * Autorización: ¿puede este usuario hacer esto? Debe ir SIEMPRE después de authMiddleware,
 * que es quien deja req.userFound. El rol se lee de la BD (no del token), así que un cambio
 * de rol aplica desde la siguiente petición.
 */
const authorizationMiddleware = ( allowedRoles = [] ) => ( req, res, next ) => {
    const role = req.userFound?.role;

    if ( ! role ) {
        return res.status(403).json({ msg: 'Error: El usuario autenticado no tiene rol definido' });
    }

    if ( ! allowedRoles.includes( role ) ) {
        return res.status(403).json({ msg: `Error: El Rol ${ role } no esta autorizado para realizar esta acción` });
    }

    next();
};

// Express acepta un arreglo de middlewares por ruta y los ejecuta en orden: autenticar → autorizar.
const requireRoles = ( allowedRoles ) => [ authMiddleware, authorizationMiddleware( allowedRoles ) ];

// Permite la ruta a los roles indicados o al propio dueño del recurso (/:id === su _id).
const requireSelfOrRoles = ( allowedRoles ) => [
    authMiddleware,
    ( req, res, next ) => {
        const { role, _id } = req.userFound;

        if ( allowedRoles.includes( role ) || String( _id ) === req.params.id ) return next();

        return res.status(403).json({ msg: `Error: El Rol ${ role } solo puede acceder a su propia cuenta` });
    }
];

export {
    authorizationMiddleware,
    requireRoles,
    requireSelfOrRoles
};
