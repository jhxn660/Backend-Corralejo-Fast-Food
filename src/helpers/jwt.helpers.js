//Genera y verifica los tokens de sesión para mantener al usuario autenticado

import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secreto', { expiresIn: '1d' });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'secreto');
};

export { generateToken, verifyToken };