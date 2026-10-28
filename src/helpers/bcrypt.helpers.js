import bcrypt from 'bcrypt';

const generatePassword =  ( originalPassword ) => {
    // Generar una cadena aleatoria de N veces
    const salt =  bcrypt.genSaltSync( 9 );                    
    
    // Mezclando y encriptando el salt con las contrasena original
    const hashPassword =  bcrypt.hashSync( originalPassword, salt );   

    return hashPassword;
}

const verifyPassword =  ( originalPassword, hashPassword ) => {
    return  bcrypt.compareSync( originalPassword, hashPassword);
}

export {
    generatePassword,
    verifyPassword
}