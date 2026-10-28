import jwt from 'jsonwebtoken';

const generateToken = ( payload ) => {

    try {

            return jwt.sign( 
            payload,                        // Carga Útil: Datos que el BackEnd quiere compartir con el FrontEnd que envia a traves del token 
             process.env.JWT_SECRET,      // Cadena Secreta (Se mezcla con el payload para proteger los datos) 
           { expiresIn: '1h' }              // Tiempo de Expiración del token
        );
        
    } catch (error) {
        console.error( error );

        return null;
    }



}


// 2.5:
const validateToken = ( token ) => {

    try {

    // Si es valido devuelve el payload, sino devuelver null
    const payload = jwt.verify( 
        token,                      // Token valido enviado por el usuario
        process.env.JWT_SECRET      // Cadena Secreta que se mezclo en el payload
    );


    console.log( 'payload: ', payload );    // Debuging

    return payload;
        
    } catch (error) {
        console.error( error );

        return null;
    }

}

export { 
    generateToken,
    validateToken,
}