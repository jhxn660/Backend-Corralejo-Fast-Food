import jwt from 'jsonwebtoken';

const generateToken = ( payload ) => {
    return jwt.sign( 
        payload,                        // Carga Útil: Datos que el BackEnd quiere compartir con el FrontEnd que envia a traves del token 
        process.env.JWT_SECRET,      // Cadena Secreta (Se mezcla con el payload para proteger los datos) 
        { expiresIn: '1h' }              // Tiempo de Expiración del token
    );

}

export { generateToken }