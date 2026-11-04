// Encripta contraseñas antes de guardarlas y verifica si coinciden al iniciar sesión.

import bcrypt from 'bcryptjs';

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, receivedPassword) => {
    return await bcrypt.compare(password, receivedPassword);
};

export { hashPassword, comparePassword };