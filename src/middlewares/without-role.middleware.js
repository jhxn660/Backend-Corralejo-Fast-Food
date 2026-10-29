const withoutRoleMiddleware = (req, res, next) => {
    // Paso 1: Obtiene los datos de la petición
    const inputData = req.body;

    // Paso 2: Elimina el rol para que se registre el rol por defecto en este caso = Usuario
    delete inputData.role; // Eliminando la propiedad role

    // Paso 3: El Middleware lanza el control de la aplicación a la siguiente función
    next();
}

export default withoutRoleMiddleware