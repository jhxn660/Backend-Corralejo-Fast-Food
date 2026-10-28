import jwt from 'jsonwebtoken';

const generateToken = ( payload ) => {
    try {
        return jwt.sign( 
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' } 
    );
        
    } catch (error) {
        console.error( error );

        return null;
    }
}

const validateToken = ( token ) => {
    try { 
    // Si es valido devuelve el payload, si no devuelve null
    const payload = jwt.verify( 
        token,                      //Token Valido enviado por el usuario
        process.env.JWT_SECRET      // Cadena secreta que se mexclo con el payload
    );

    console.log( 'payload: ', payload);

    return payload;
    }
    catch ( error ) {
        console.error( error );

        return null;
    }

}


export { 
    generateToken,
    validateToken
}