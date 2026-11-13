import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import { dbCreateSupply, dbGetSupply, dbGetSupplies, dbUpdateSupply, dbDeleteSupply } from '../services/supplies.services.js';

const createSupply = async (req, res) => {
    try {
        // Extrae el ID del usuario encontrado por el Middleware de Authentication
        const user_id = req.userFound._id;

        const inputData = req.body;
        inputData.createdBy = user_id; // <--- Agrega el ID del usuario que registra el insumo (CAMBIO: el comentario decia "categoria" por error)

        // El creador es el usuario autenticado, no el que venga en el body
        inputData.createdBy = req.userFound._id;

        const data = await dbCreateSupply(inputData);

        res.status(201).json({ msg: 'Registra Insumo', data: data });

    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se pudo registrar el insumo' });
    }
};

const getSupply = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbGetSupply(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Insumo no encontrado' });
        }

        res.status(200).json({ msg: 'Obtiene un Insumo', data: data });

    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se pudo obtener el insumo por id' });
    }
};

const getSupplies = async (req, res) => {
    try {
        const data = await dbGetSupplies();

        res.status(200).json({ msg: 'Lista de Insumos', data: data });

    } catch (error) {
        console.error(error);

        res.status(500).json({ msg: 'No se ha podido obtener los insumos' });
    }
};

const updateSupply = async (req, res) => {
    try {
        const user_id = req.userFound._id;
        
        const id = req.params.id;

        const inputData = req.body;
        inputData.createdBy = user_id; // <--- Agrega el ID del usuario que registra el insumo (CAMBIO: el comentario decia "categoria" por error)

        // El creador es el usuario autenticado, no el que venga en el body
        inputData.createdBy = req.userFound._id;

        const data = await dbUpdateSupply(id, inputData);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Insumo no encontrado' });
        }

        res.status(200).json({ msg: 'Insumo Actualizado', data: data });

    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se ha podido actualizar el insumo' });
    }
};

const deleteSupply = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteSupply(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Insumo no encontrado' });
        }

        res.status(200).json({ msg: 'Insumo Eliminado', data: data });

    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        // Error generico del servidor
        res.status(500).json({ msg: 'No se ha podido eliminar el insumo' });
    }
};

export {
    createSupply,
    getSupply,
    getSupplies,
    updateSupply,
    deleteSupply
};
