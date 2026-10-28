const authorizationMiddleware = ( req, res, next) => {
    console.log('Hola soy el middleware de autorizacion');
    next();
}

export {
    authorizationMiddleware
}