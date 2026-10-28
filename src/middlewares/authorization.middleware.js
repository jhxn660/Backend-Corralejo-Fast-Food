const authorizationMiddleware = ( req, res, next ) => {

    console.log( 'Hola soy el Middleware de Autorización' );
    next();
}

export {
    authorizationMiddleware
}