import { generatePassword } from "../helpers/bcrypt.helper.js";
import { HttpError } from "../helpers/http-error.helper.js";
import userModel from "../models/user.model.js";
import { USER_ROLES } from "../config/roles.config.js";

// La política se valida aquí y no en el Schema porque el Schema solo ve el hash (60 caracteres),
// nunca la contraseña en claro. Mayúscula, minúscula, dígito y símbolo; 7 a 60 caracteres, sin espacios.
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[^\s]{7,60}$/;

const PUBLIC_RELATIONS = [ 'createdBy', 'name email role' ];

// Crear un usuario y devolverlo sin la contraseña
const dbCreateUser = async (newUser) => {
    if (typeof newUser.password !== 'string' || !passwordRegex.test(newUser.password)) {
        throw new HttpError(400, 'La contraseña debe tener entre 7 y 60 caracteres, incluir al menos una mayúscula, una minúscula, un número y un símbolo');
    }

    const user = await userModel.create({ ...newUser, password: await generatePassword(newUser.password) });

    const { password, ...userWithoutPassword } = user.toObject();

    return userWithoutPassword;
};

const dbGetUser = async (id) => {
    return await userModel.findOne({ _id: id }).select('-password').populate(...PUBLIC_RELATIONS);
};

/**
 * Listado paginado con filtro de estado y rol opcional.
 * @param {string} status - 'true' (activos), 'false' (inactivos), 'all' (todos); otro valor = activos
 */
const dbGetUsers = async (page = 1, limit = 10, status = 'true', role) => {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 10);

    const filter = {};

    if (status === 'false' || status === false) filter.state = false;
    else if (status !== 'all') filter.state = true;

    if (role && USER_ROLES.includes(role)) filter.role = role;

    // La página y el total se piden en paralelo con el mismo filtro
    const [ users, total ] = await Promise.all([
        userModel.find(filter)
            .select('-password')
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .populate(...PUBLIC_RELATIONS),
        userModel.countDocuments(filter)
    ]);

    return { users, total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) };
};

// findOneAndUpdate NO re-hashea la contraseña: el controlador la descarta antes de llegar aquí.
const dbUpdateUser = async (id, userUpdated) => {
    return await userModel
        .findOneAndUpdate({ _id: id }, userUpdated, { returnDocument: 'after', runValidators: true })
        .select('-password');
};

const dbDeleteUser = async (id) => {
    return await userModel.findOneAndDelete({ _id: id }).select('-password');
};

/**
 * Para el LOGIN: devuelve el hash de la contraseña porque hay que compararlo.
 * Nunca usar en respuestas al cliente. Solo usuarios activos: uno deshabilitado no puede entrar.
 */
const dbGetUserByEmail = async (email) => {
    return await userModel.findOne({ email: email.trim().toLowerCase(), state: true });
};

// Para el middleware de autenticación: el usuario vigente del token, sin contraseña.
const dbGetActiveUserById = async (id) => {
    return await userModel.findOne({ _id: id, state: true }).select('-password');
};

export {
    dbCreateUser,
    dbGetUser,
    dbGetUsers,
    dbUpdateUser,
    dbDeleteUser,
    dbGetUserByEmail,
    dbGetActiveUserById
};
