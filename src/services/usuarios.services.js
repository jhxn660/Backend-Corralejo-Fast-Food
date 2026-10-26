// Servicio se habla con la base de datos
// Estas funciones realizaran las consultas a la base de datos

import usuarioModel from "../models/usuario.model.js";

// TODO: Conectar el Modelo de Usuarios con la Base de datos

const dbCreateUsuario = async ( newUsuario ) => {
    return await usuarioModel.create(newUsuario); //Promesa Resuelta (await)
}

const dbGetUsuario = async ( id ) => { 
    return await usuarioModel.findOne({ _id: id });
}

const dbGetUsuarios = async (role, state) => {
    let filter = {};

    const availableRoles = ['Administrador', 'Empleado', 'Usuario', 'UsuarioT'];

    // Filtrar por rol (si se envía y es válido)
    if (role && availableRoles.includes(role)) {
        filter.role = role;
    }

    // Filtrar por estado (llega como texto 'true' / 'false' desde la URL)
    if (state === 'true' || state === 'false') {
        filter.state = state === 'true';
    }

    return await usuarioModel
        .find(filter)
        .select('-password')                       // Excluye la contraseña
        .populate('createdBy', 'name email role'); // Pobla solo datos seguros del creador
}

const dbUpdateUsuario = async ( id, usuarioUpdated ) => {
    return await usuarioModel
        .findOneAndUpdate(
            { _id: id },
            usuarioUpdated,
            {
                new: true,            // Devuelve el documento ya actualizado
                runValidators: true   // Aplica las reglas del esquema (match, enum, maxlength...)
            }
        )
        .select('-password');         // No devolver la contraseña
}

const dbDeleteUsuario = async ( id ) => {
    return await usuarioModel
        .findOneAndDelete({ _id: id })
        .select('-password');         // No devolver la contraseña del usuario eliminado
}

export {
    dbCreateUsuario,
    dbGetUsuario,
    dbGetUsuarios,
    dbUpdateUsuario,
    dbDeleteUsuario
};