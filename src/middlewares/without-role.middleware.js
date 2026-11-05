const withoutRoleMiddleware = ( req, res, next ) => {
    // Obtiene los datos de la peticion 
    const inputData = req.body;

    // Elimina el rol para que se registre el rol por defecto
    delete inputData.role;      // Eliminar la propiedad role

    // El middleware lanza el control de la aplicacion a la siguiente funcion
    next();
}

export default withoutRoleMiddleware;