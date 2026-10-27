import bcrypt from 'bcrypt';

// const generatePassword = async ( originalPassword ) => {
//     const salt = await bcrypt.genSalt( 9 );                            // Generar una cadena aleatoria N Veces

//     const hashPassword = await bcrypt.hash( originalPassword, salt );  // Mezclando y encriptando el salt con con la contraseña original

//     return hashPassword;
// }

const generatePassword =  ( originalPassword ) => {
     // Generar una cadena aleatoria N Veces
    const salt = bcrypt.genSaltSync( 9 );                                 

    // Mezclando y encriptando el salt con con la contraseña original
    const hashPassword = bcrypt.hashSync( originalPassword, salt );    

    return hashPassword;
}

// Usar solamente await o Solamente sync 
const verifyPassword = ( originalPassword , hashPassword ) => {
    // Retorna true o false True si ambas contraseñas son iguales False si no son iguales las contraseñas
    return bcrypt.compareSync(
        originalPassword,   // 123456...
        hashPassword        // contraseña encriptada que viene de la base de datos
    )
}

export {
    generatePassword, 
    verifyPassword
}