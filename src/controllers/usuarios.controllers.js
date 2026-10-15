// Controlador define quien hace una acción especifica

import { dbCreateUsuario } from "../services/usuarios.services.js";

//Controlador define quien hace una accion especifica
const createUsuario = async (req, res) => {
    try {

        //Obtenemos el usuario 
        const usuario = req.body;

        const newUsuario = await dbCreateUsuario(usuario);

        res.json({ msg: 'Registra Usuario', user: newUsuario });
    } catch (error) {
        console.error(error);
        res.json({
            msg: 'Error al registrar el usuario'
        });
    }
}

const getUsuario = (req, res) => {

    res.json({ msg: 'Obtiene todos los usuarios' });
}

const updatePUsuario = (req, res) => {
    res.json({ msg: 'Actualizar todas las propiedades de un usuario' });
}

const updateMPUsuario = (req, res) => {
    res.json({ msg: 'Actualizar una o mas propiedades del usuario' });
}

const deleteUsuario = (req, res) => {
    res.json({ msg: 'Elimina un Usuario' });
}


export {
    getUsuario, createUsuario, updatePUsuario, updateMPUsuario, deleteUsuario
}