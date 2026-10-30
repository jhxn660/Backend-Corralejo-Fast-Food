import {
    dbCreateCategory,
    dbGetCategory,
    dbGetCategories,
    dbUpdateCategory,
    dbDeleteCategory
} from '../services/categories.services.js';

const createCategory = async (req, res) => {
    try {
        // Extrae los datos del cuerpo de la peticion
        const inputData = req.body;

        // El creador es el usuario autenticado, no el que venga en el body
        inputData.createdBy = req.userFound._id;

        // Usar el servicio para registrar
        const data = await dbCreateCategory(inputData);

        res.status(201).json({ msg: 'Registra Categoria', data: data });

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

        // 2. Verificar si el error es por duplicidad (campo unique)
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];

            return res.status(400).json({
                msg: `ERROR: por duplicidad en el campo '${field}'`,
                [field]: `El campo '${field}' con el valor '${error.keyValue[field]}', ya se encuentra registrado.`
            });
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se pudo registrar la categoria' });
    }
};

const getCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbGetCategory(id);

        res.status(200).json({ msg: 'Obtiene una categoria', data: data });

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

        res.status(200).json({ msg: 'Categoria Actualizada', data: data });

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

        // 2. Verificar si el error es por duplicidad (campo unique)
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
        res.status(500).json({ msg: 'No se actualizo la categoria' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteCategory(id);

        res.status(200).json({ msg: 'Categoria Eliminada', data: data });

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