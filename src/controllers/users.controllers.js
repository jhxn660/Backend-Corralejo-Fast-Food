// Controlador define quien hace una accion especifica
import { generatePassword } from '../helpers/bcrypt.helpers.js';
import { dbCreateUser, dbGetUser, dbGetUsers, dbUpdateUser, dbDeleteUser } from '../services/users.services.js';

const createUser = async (req, res) => {
    try {
        // Extrae el _id del userFound usando una desestructuración del payload que envia en la petición (req) el middleware de Autentication
        const userFound = req.userFound;

        // Usa un operador ternario para asignar el valor de _id a la variable id, o null si no existe
        const id = userFound?._id ? userFound._id : null;
        
        // Extrae los datos del cuerpo de la petición
        const inputData = req.body;
        inputData.createdBy = id;
        
        // Encripta la contraseña antes de guardarla en la base de datos
        inputData.password = generatePassword(inputData.password);
        const newUser = await dbCreateUser(inputData);

        res.status(201).json({ msg: 'Registra Usuario', user: newUser });

    } catch (error) {
        console.error(error);

        // Verificar si el error es por duplicidad
        if (error.code == 11000) {
            // keyValue muestra el item repetido con el parametro sin Object.keys
            // Object.keys( error.keyValue ) muestra solamente la variable
            const field = Object.keys(error.keyValue)[0];

            return res.status(400).json({
                msg: `ERROR: por duplicidad en el campo '${field}'`,
                [field]: `El campo '${field}' con el valor '${error.keyValue[field]}', ya se encuentra registrado.`
            });
        }

        res.status(500).json({ msg: 'Error al registrar el usuario' });
    }
};

const getUser = async (req, res) => {
    // El id se deja afuera
    const id = req.params.id;

    try {
        const data = await dbGetUser(id);

        res.status(200).json({ msg: 'Obtiene un Usuario por ID', data: data });

    } catch (error) {
        console.error(error);
        console.log('ID: ', id);

        // Verificar formato del ID (ObjectId) en caso de que se envie un ID en el body
        if (error.name === 'CastError') {
            return res.status(400).json({
                msg: `El ID debe tener 24 caracteres y el enviado tiene ${id.length}`,
                [error.path]: `El identificador ${error.value} no tiene el formato valido que requiere MongoDB`
            });
        }

        res.json({ msg: 'No se pudo obtener el Usuario por id' });
    }
};

const getUsers = async (req, res) => {
    try {
        const { role, state } = req.query;  // GET /api/users?role=Empleado&state=true

        const data = await dbGetUsers(role, state);

        res.status(200).json({ msg: 'Lista de Usuarios', data: data });

    } catch (error) {
        console.error(error);

        res.status(500).json({ msg: 'No se ha podido obtener los usuarios' });
    }
};

const updatePUser = (req, res) => {
    res.status(200).json({ msg: 'Actualizar todas las propiedades de un usuario' });
};

const updateMPUser = async (req, res) => {
    try {
        const id = req.params.id;

        // Se descarta el password del body: findOneAndUpdate no ejecuta el hook de encriptacion
        const { password, ...userUpdated } = req.body;

        const data = await dbUpdateUser(id, userUpdated);

        res.status(200).json({ msg: 'Usuario Actualizado', data: data });

    } catch (error) {
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

        // Error generico del servidor
        res.status(500).json({ msg: 'No se ha podido actualizar el usuario' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteUser(id);

        res.status(200).json({ msg: 'Usuario Eliminado', data: data });

    } catch (error) {
        console.error(error);

        // 3. Verificar formato del ID (ObjectId) enviado por la ruta
        if (error.name === 'CastError') {
            return res.status(400).json({
                msg: `El ID debe tener 24 caracteres y el enviado tiene ${error.value.length}`,
                [error.path]: `El identificador '${error.value}' no tiene el formato valido que requiere MongoDB`
            });
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se ha podido eliminar el usuario' });
    }
};

export {
    createUser,
    getUser,
    getUsers,
    updatePUser,
    updateMPUser,
    deleteUser
};