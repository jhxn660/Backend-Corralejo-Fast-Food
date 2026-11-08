import jwt from 'jsonwebtoken';

const validarJWT = (req, res, next) => {
    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try {
        // Actualizado a JWT_SECRET para que coincida con el helper
        const { uid } = jwt.verify(token, process.env.JWT_SECRET);
        req.uid = uid;

        next(); 
    } catch (error) {
        // Distinguimos si expiró el tiempo límite
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                ok: false,
                msg: 'El token ha expirado'
            });
        }

        return res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }
};

export { validarJWT };