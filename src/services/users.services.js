import userModel from '../models/user.model.js';

// Crear un usuario y devolverlo sin la contraseña
const dbCreateUser = async (newUser) => {
    const user = await userModel.create(newUser);

    // Separa la contraseña del resto de datos y devuelve solo el resto
    const { password, ...userWithoutPassword } = user.toObject();

    return userWithoutPassword;
};

// Obtener un usuario por su ID
const dbGetUser = async (id) => {
    return await userModel
        .findOne({ _id: id })
        .select('-password')                        // Excluye la contraseña
        .populate('createdBy', 'name email role');
};

// Listar usuarios con filtros opcionales por rol y estado
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
        .select('-password')
        .populate('createdBy', 'name email role');
};

// Actualizar un usuario por su ID
const dbUpdateUser = async (id, userUpdated) => {
    return await userModel
        .findOneAndUpdate(
            { _id: id },
            userUpdated,
            {
                new: true,           // Devuelve el documento ya actualizado
                runValidators: true  // Aplica las reglas del modelo tambien al actualizar
            }
        )
        .select('-password');
};

// Eliminar un usuario por su ID
const dbDeleteUser = async (id) => {
    return await userModel
        .findOneAndDelete({ _id: id })
        .select('-password');
};

// Consultar por correo para el login
// Ojo: SI devuelve la contraseña, porque el login la necesita para compararla
// No usar en rutas que respondan datos al cliente
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