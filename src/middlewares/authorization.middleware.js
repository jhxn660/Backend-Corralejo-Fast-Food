// AllowedRoles son Roles permitidos
const authorizationMiddleware = ( allowedRoles ) => {

    return ( req, res, next ) => {

        // Extraer el rol del usuario del ayload del token que valida el middleware de autenticacion
        const role = req.userFound.role;

        if( ! role ) {
            return res.status(403).json({
                msg: 'Error: El usuario autenticado no tiene rol definido'
            });
        }

        // Verificar si el rol del usuario se encuentra en la lista de roles permitidos para esta ruta
        if( ! allowedRoles.includes( role ) ) {
            return req.status(403).json({
                msg: `Error: El rol ${ role } no esta autorizado para realizar esta accion`
            });
        }

        console.log(`Usuario autorizado con rol ${role}`);

        next();
    } 

}

export {
    authorizationMiddleware
}