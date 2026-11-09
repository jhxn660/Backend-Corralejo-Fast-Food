// Controlador define quien hace una accion especifica
import { generatePassword } from "../helpers/bcrypt.helpers.js";
import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import { dbCreateUser, dbGetUser, dbGetUsers, dbUpdateUser, dbDeleteUser } from "../services/users.services.js";

const createUser = async (req, res) => {
    try {
        // Extrae el _id del userFound usando una desestructuración del payload que envia en la petición (req) el middleware de Autentication
        const userFound = req.userFound;

        // Usa un operador ternario para asignar el valor de _id a la variable id, o null si no existe
        const id = userFound?._id ? userFound._id : null;

        // Extrae los datos del cuerpo de la petición
        const inputData = req.body;
        inputData.createdBy = id;

        const newUser = await dbCreateUser(inputData);

        // Usar el servicio para registrar (Mongoose valida automáticamente contra UserSchema)
        res.status(201).json({ msg: 'Registra Usuario', user: newUser });

    } catch (error) {
        console.error(error);

        // Verifica si la excepción proviene de una validación de Mongoose
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            // Retorna como respuesta el objeto: { [propiedad]: mensajeDeError } con código HTTP 400
            return res.status(400).json(validationErrors);
        }

        if(error.name == 'PasswordValidationError' ) {
            return res.status(400).json({
                msg: error.message
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

        if (!data) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

    } catch (error) {
        console.error(error);

        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({msg: 'No se pudo obtener el Usuario por ID'});
    }
};

// Controlador para listar usuarios con paginación y filtro de status
const getUsers = async (req, res) => {
    try {
        // Paso 1: Extraer los query parameters de la URL
        // Ejemplos:
        //   - /api/users?status=true   (usuarios activos)
        //   - /api/users?status=false  (usuarios inactivos)
        //   - /api/users?status=all    (todos los usuarios)
        //   - /api/users?page=1&limit=10&status=all
        const { page = 1, limit = 15, state = 'all' } = req.query;

        // Paso 2: Invocar el servicio de consulta enviando paginación y filtro de estado
        const data = await dbGetUsers(page, limit, state);

        // Paso 3: Retornar la respuesta exitosa en formato JSON con la metadata y la lista
        res.status(200).json({ msg: 'Lista de Usuarios', data: data });
    }
    catch (error) {
        // En caso de excepción, imprimir el error en consola para depuración en el servidor
        console.error(error);

        // Responder al cliente con un mensaje de error descriptivo
        res.status(500).json({ msg: 'No ha podido obtener los usuarios' });
    }
};

const updateMPUser = async (req, res) => {
    try {
        const id = req.params.id;

        // Se descarta el password del body: findOneAndUpdate no ejecuta el hook de encriptacion
        const { password, ...inputData } = req.body;

        // Usar el servicio para actualizar (con runValidators: true para validar en Mongoose)
        const data = await dbUpdateUser(id, inputData);

        if (!data) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.status(200).json({ msg: 'Usuario Actualizado', data: data });
    } catch (error) {
        console.error(error);

        // Verifica si la excepción proviene de una validación de Mongoose al actualizar
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            // Retorna como respuesta el objeto: { [propiedad]: mensajeDeError } con código HTTP 400
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se ha podido actualizar el usuario' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteUser(id);
        if (!data) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.status(200).json({ msg: 'Usuario Eliminado', data: data });
    } catch (error) {
        console.error(error);

        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se ha podido eliminar el usuario' });
    }
};

export {
    createUser,
    getUser,
    getUsers,
    updateMPUser,
    deleteUser
};



