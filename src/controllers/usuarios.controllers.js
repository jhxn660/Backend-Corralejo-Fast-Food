// Controlador define quien hace una acción especifica

import { dbCreateUsuario, dbGetUsuario } from "../services/usuarios.services.js";

//Controlador define quien hace una accion especifica
const createUsuario = async (req, res) => {
    try {

        //Obtenemos el usuario 
        const usuario = req.body;

        const newUsuario = await dbCreateUsuario(usuario);

        res.status(201).json({ msg: 'Registra Usuario', user: newUsuario });

    } catch (error) {

        console.error(error);

        // Verificar si el error es por duplicidad de categoria
        if( error.code == 11000 ) {
            // console.log( '1 >>>>', error.keyValue ); // keyValue muestra el item repetido con el parametro sin object kets
            // console.log( '2 >>>>', Object.keys ( error.keyValue )); // Muestra solamente la variable
            const field = Object.keys( error.keyValue)[0];

            return res.status(400).json({
                msg: `ERROR: por duplicidad en el campo '${ field }'`,
                [field]: `El campo '${ field }' con el valor '${ error.keyValue[ field ]}', ya se encuentra registrado.`
            });
        } 

        res.status(500).json({
            msg: 'Error al registrar el usuario'
        });
    }
}

const getUsuario = async (req, res) => {
    // El id se deja afuera
    const id = req.params.id;
    try {


        const data = await dbGetUsuario(id);

        res.status(200).json({ msg: 'Obtiene un Usuario por ID', data: data });

    } catch (error) {

        console.error(error);

        console.log( 'ID: ', id );

        // Verificar formato del ID (ObjectId) en case de que se envie un ID en el body
        if( error.name === 'CastError' ) {
            res.status(400).json({
                msg: `El ID debe tener 24 caracteres y el enviado tiene ${id.length}`,
                [error.path]: `El identificador ${ error.value } no tiene el formato valido que requiere MongoDB`
            });
        }


        res.json({ msg: 'No se pudo obtener el Usuario por id' });

    }
}

const updatePUsuario = (req, res) => {
    res.status(200).json({ msg: 'Actualizar todas las propiedades de un usuario' });
}

const updateMPUsuario = (req, res) => {
    res.status(200).json({ msg: 'Actualizar una o mas propiedades del usuario' });
}

const deleteUsuario = (req, res) => {
    res.status(200).json({ msg: 'Elimina un Usuario' });
}


export {
    getUsuario, createUsuario, updatePUsuario, updateMPUsuario, deleteUsuario
}