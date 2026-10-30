// Servicio se habla con la base de datos
// Estas funciones realizaran las consultas a la base de datos

import userModel from '../models/user.model.js';

const dbCreateUser = async (newUser) => {
    return await userModel.create(newUser);  // Promesa Resuelta (await)
};

const dbGetUser = async (id) => {
    return await userModel.findOne({ _id: id });
};

const dbGetUsers = async (role, state) => {
    let filter = {};

    const availableRoles = ['Administrador', 'Empleado', 'Usuario', 'UsuarioT'];

    // Filtrar por rol (si se envia y es valido)
    if (role && availableRoles.includes(role)) {
        filter.role = role;
    }

    // Filtrar por estado (llega como texto 'true' / 'false' desde la URL)
    if (state === 'true' || state === 'false') {
        filter.state = state === 'true';
    }

    return await userModel
        .find(filter)
        .select('-password')                        // Excluye la contraseña
        .populate('createdBy', 'name email role');  // Pobla solo datos seguros del creador
};

const dbUpdateUser = async (id, userUpdated) => {
    return await userModel
        .findOneAndUpdate(
            { _id: id },
            userUpdated,
            {
                new: true,           // Devuelve el documento ya actualizado
                runValidators: true  // Aplica las reglas del esquema (match, enum, maxlength...)
            }
        )
        .select('-password');        // No devolver la contraseña
};

const dbDeleteUser = async (id) => {
    return await userModel
        .findOneAndDelete({ _id: id })
        .select('-password');        // No devolver la contraseña del usuario eliminado
};

// Consultar por correo para Authentication en Controllers
const dbGetUserByEmail = async (email, state = true) => {
    return await userModel.findOne({ email: email, state: state });
};

export {
    dbCreateUser,
    dbGetUser,
    dbGetUsers,
    dbUpdateUser,
    dbDeleteUser,
    dbGetUserByEmail
};