import bcrypt from 'bcrypt';

// const generatePassword = async ( originalPassword ) => {
//     // Generar una cadena aleatoria N Veces
//     const salt = await bcrypt.genSalt( 9 );
//     // Mezclando y encriptando el salt con la contraseña original
//     const hashPassword = await bcrypt.hash( originalPassword, salt );
//     return hashPassword;
// }

const generatePassword = (originalPassword) => {
    // Generar una cadena aleatoria N veces
    const salt = bcrypt.genSaltSync(9);

    // Mezclando y encriptando el salt con la contraseña original
    const hashPassword = bcrypt.hashSync(originalPassword, salt);

    return hashPassword;
};

// Usar solamente await o solamente sync
const verifyPassword = (originalPassword, hashPassword) => {
    // Retorna true si ambas contraseñas son iguales, false si no son iguales
    return bcrypt.compareSync(
        originalPassword,  // 123456...
        hashPassword       // Contraseña encriptada que viene de la base de datos
    );
};

export {
    generatePassword,
    verifyPassword
};