import { verifyToken } from '../helpers/jwt.helpers.js';

const authenticate = (req, res, next) => {
    try {
        // Busca el token directamente en el header 'x-token' que configuraste en Bruno
        const token = req.header('x-token');
        
        if (!token) return res.status(403).json({ message: "No se proporcionó un token" });

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token no válido o expirado" });
    }
};

export default authenticate;