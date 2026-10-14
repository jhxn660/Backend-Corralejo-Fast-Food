// Servicio se habla con la base de datos
// Estas funciones realizaran las consultas a la base de datos

import usuarioModel from "../models/usuario.model.js";

// TODO: Conectar el Modelo de Usuarios con la Base de datos

const dbCreateUsuario = async ( newUsuario ) => {
    return await usuarioModel.create(newUsuario); //Promesa Resuelta (await)
}

const dbGetUsuario = () => {}

const dbUpdateUsuario = () => {}

const dbDeleteUsuario = () => {}

export {
    dbCreateUsuario,
    dbGetUsuario,
    dbUpdateUsuario,
    dbDeleteUsuario
};