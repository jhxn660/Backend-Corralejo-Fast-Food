import {
    dbCreateInsumo,
    dbGetInsumo,
    dbGetInsumos,
    dbUpdateInsumo,
    dbDeleteInsumo
} from '../services/insumos.services.js';

const createInsumo = async (req, res) => {
    try {
        const inputData = req.body;

        // El creador es el usuario autenticado, no el que venga en el body
        inputData.createdBy = req.userFound._id;

        const data = await dbCreateInsumo(inputData);

        res.status(201).json({ msg: 'Registra Insumo', data: data });

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
        res.status(500).json({ msg: 'No se pudo registrar el insumo' });
    }
};

const getInsumo = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbGetInsumo(id);

        res.status(200).json({ msg: 'Obtiene un Insumo', data: data });

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
        res.status(500).json({ msg: 'No se pudo obtener el insumo por id' });
    }
};

const getInsumos = async (req, res) => {
    try {
        const data = await dbGetInsumos();

        res.status(200).json({ msg: 'Lista de Insumos', data: data });

    } catch (error) {
        console.error(error);

        res.status(500).json({ msg: 'No se ha podido obtener los insumos' });
    }
};

const updateInsumo = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;

        const data = await dbUpdateInsumo(id, inputData);

        res.status(200).json({ msg: 'Insumo Actualizado', data: data });

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
        res.status(500).json({ msg: 'No se ha podido actualizar el insumo' });
    }
};

const deleteInsumo = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteInsumo(id);

        res.status(200).json({ msg: 'Insumo Eliminado', data: data });

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
        res.status(500).json({ msg: 'No se ha podido eliminar el insumo' });
    }
};

export {
    createInsumo,
    getInsumo,
    getInsumos,
    updateInsumo,
    deleteInsumo
};