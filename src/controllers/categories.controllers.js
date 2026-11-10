import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import { dbCreateCategory, dbGetCategory, dbGetCategories, dbUpdateCategory, dbDeleteCategory } from '../services/categories.services.js';

const createCategory = async (req, res) => {
    try {
        // Extrae el _id del userFound usando una desestructuración del payload que envia en la petición (req) el middleware de Autentication
        const { _id } = req.userFound;

        // Extrae los datos del cuerpo de la peticion
        const inputData = req.body;
        inputData.createdBy = _id; // <--- Agrega el ID del usuario que registra la categoria

        // El creador es el usuario autenticado, no el que venga en el body
        inputData.createdBy = req.userFound._id;

        // Usar el servicio para registrar
        const data = await dbCreateCategory(inputData);

        res.status(201).json({ msg: 'Registra Categoria', data: data });

    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se pudo registrar la categoria' });
    }
};

const getCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbGetCategory(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Categoria no encontrada' });
        }

        res.status(200).json({ msg: 'Obtiene una categoria', data: data });

    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se pudo obtener la categoria por id' });
    }
};

const getCategories = async (req, res) => {
    try {
        const data = await dbGetCategories();

        res.status(200).json({ msg: 'Lista de Categorias', data: data });

    } catch (error) {
        console.error(error);

        res.status(500).json({ msg: 'No ha podido obtener las categorias' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;

        const data = await dbUpdateCategory(id, inputData);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Categoria no encontrada' });
        }

        res.status(200).json({ msg: 'Categoria Actualizada', data: data });

    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se actualizo la categoria' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteCategory(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Categoria no encontrada' });
        }

        res.status(200).json({ msg: 'Categoria Eliminada', data: data });

    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se ha podido eliminar la categoria' });
    }
};

export {
    createCategory,
    getCategory,
    getCategories,
    updateCategory,
    deleteCategory
};
