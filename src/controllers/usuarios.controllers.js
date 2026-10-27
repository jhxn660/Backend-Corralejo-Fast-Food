// Controlador define quien hace una acción especifica

import { generatePassword } from "../helpers/bcrypt.helpers.js";
import { dbCreateUsuario, dbDeleteUsuario, dbGetUsuario, dbGetUsuarios, dbUpdateUsuario } from "../services/usuarios.services.js";

//Controlador define quien hace una accion especifica
const createUsuario = async (req, res) => {
    try {

        //Obtenemos el usuario 
        const usuario = req.body;

        // Encripte la contraseña de guardarla en la base de datos.
        usuario.password = generatePassword(usuario.password);

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
            return res.status(400).json({
                msg: `El ID debe tener 24 caracteres y el enviado tiene ${id.length}`,
                [error.path]: `El identificador ${ error.value } no tiene el formato valido que requiere MongoDB`
            });
        }


        res.json({ msg: 'No se pudo obtener el Usuario por id' });

    }
}

const getUsuarios = async (req, res) => {
    try {
        const { role, state } = req.query; // GET /api/usuarios?role=Empleado&state=true

        const data = await dbGetUsuarios(role, state);

        res.status(200).json({ msg: 'Lista de Usuarios', data: data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'No se ha podido obtener los usuarios' });
    }
}

const updatePUsuario = (req, res) => {
    res.status(200).json({ msg: 'Actualizar todas las propiedades de un usuario' });
}

const updateMPUsuario = async (req, res) => {
    try {
        const id = req.params.id;

        // Se descarta el password del body: findOneAndUpdate no ejecuta el hook de encriptación
        const { password, ...usuarioUpdated } = req.body;

        const data = await dbUpdateUsuario(id, usuarioUpdated);

        res.status(200).json({ msg: 'Usuario Actualizado', data: data });
    }
    catch (error) {
        console.error(error);

        // 1. Personaliza los mensajes de error definidos en el Modelo
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ errors });
        }

        // 2. Verificar si el error es por duplicidad (email, phone)
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                msg: `ERROR: por duplicidad en el campo '${field}'`,
                [field]: `El campo '${field}' con el valor '${error.keyValue[field]}', ya se encuentra registrado.`
            });
        }

        // 3. Verificar formato del ID (ObjectId) enviado por la ruta
        if (error.name === 'CastError') {
            return res.status(400).json({
                msg: `El ID debe tener 24 caracteres y el enviado tiene ${error.value.length}`,
                [error.path]: `El identificador '${error.value}' no tiene el formato valido que requiere MongoDB`
            });
        }

        // Error genérico del servidor
        res.status(500).json({ msg: 'No se ha podido actualizar el usuario' });
    }
}

const deleteUsuario = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteUsuario(id);

        res.status(200).json({ msg: 'Usuario Eliminado', data: data });
    }
    catch (error) {
        console.error(error);

        // 3. Verificar formato del ID (ObjectId) enviado por la ruta
        if (error.name === 'CastError') {
            return res.status(400).json({
                msg: `El ID debe tener 24 caracteres y el enviado tiene ${error.value.length}`,
                [error.path]: `El identificador '${error.value}' no tiene el formato valido que requiere MongoDB`
            });
        }

        // Error genérico del servidor
        res.status(500).json({ msg: 'No se ha podido eliminar el usuario' });
    }
}


export {
    
    getUsuario,
    getUsuarios,
    createUsuario, 
    updatePUsuario, 
    updateMPUsuario, 
    deleteUsuario
}