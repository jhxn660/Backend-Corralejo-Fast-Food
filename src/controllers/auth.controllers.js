import asyncHandler from "../helpers/async-handler.helper.js";
import { HttpError } from "../helpers/http-error.helper.js";
import { verifyPassword } from "../helpers/bcrypt.helper.js";
import { generateToken } from "../helpers/jwt.helper.js";
import { dbGetUserByEmail } from "../services/users.services.js";

// Login y renovación emiten exactamente el mismo payload; el middleware lo resuelve por `_id`.
const buildTokenPayload = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    state: user.state
});

// Documento de Mongoose → objeto plano sin la contraseña
const toPublicUser = (user) => {
    const { password, ...publicUser } = user.toObject();

    return publicUser;
};

const signOrFail = (user, message) => {
    const token = generateToken(buildTokenPayload(user));

    // generateToken devuelve null si la firma falla (p. ej. JWT_SECRET sin definir)
    if (!token) throw new HttpError(500, message);

    return token;
};

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Se exige string: un objeto como { "$ne": null } se convertiría en un operador de consulta de Mongo
    if (typeof email !== 'string' || !email.trim()) {
        throw new HttpError(400, 'se olvido pasar el correo en el campo email');
    }

    if (typeof password !== 'string' || !password) {
        throw new HttpError(400, 'se olvido pasar la contraseña en el campo password');
    }

    const userFound = await dbGetUserByEmail(email);

    // Mismo 401 si el correo no existe o la contraseña falla: distinguirlos revela qué correos están registrados
    if (!userFound || !verifyPassword(password, userFound.password)) {
        throw new HttpError(401, 'Credenciales inválidas');
    }

    res.json({
        msg: 'Login de Usuario',
        token: signOrFail(userFound, 'No se pudo generar el token de acceso'),
        data: toPublicUser(userFound)
    });
}, 'No se pudo verificar la autenticidad de las credenciales');

// authMiddleware ya validó el token vigente y dejó el usuario en req.userFound: solo se emite uno nuevo.
const verifyAuthenticate = asyncHandler(async (req, res) => {
    res.json({
        msg: 'Autenticidad del token Verificado con exito',
        token: signOrFail(req.userFound, 'No se pudo renovar el token de acceso'),
        data: toPublicUser(req.userFound)
    });
}, 'No se pudo verificar la autenticidad de las credenciales');

export {
    loginUser,
    verifyAuthenticate
};
