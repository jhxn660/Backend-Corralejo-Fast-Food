import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import {
    dbCreatePQRS,
    dbDeletePQRS,
    dbGetPQRSList,
    dbUpdatePQRS,
    dbGetPQRS
} from "../services/pqrs.services.js";

const createPQRS = async (req, res) => {
    try {
        // CAMBIO: el autor es el Cliente autenticado que deja authMiddleware en req.userFound
        // (antes se leía req.uid, que siempre llegaba undefined).
        const usuarioId = req.userFound._id;

        // 2. Extraemos los datos del body de manera limpia
        const bodyData = req.body;

        // 3. Enviamos ambos parámetros por separado al servicio
        const data = await dbCreatePQRS(bodyData, usuarioId);

        res.status(201).json({ msg: 'Registrar PQRS', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo registrar la PQRS' });
    }
}

const getPQRS = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetPQRS(query);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'PQRS no encontrada' });
        }

        res.json({ msg: 'Obtener PQRS por ID', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se pudo obtener la PQRS'
        });
    }
}

const getPQRSList = async (req, res) => {
    try {
        const data = await dbGetPQRSList();

        res.json({ msg: 'Listar total de PQRS', data: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'No se pueden listar las PQRS'
        });
    }
}

const updatePQRS = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdatePQRS(id, inputData);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'PQRS no encontrada' });
        }

        res.json({ msg: 'Actualizar PQRS', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se pudo actualizar la PQRS'
        });
    }
}

const deletePQRS = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeletePQRS(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'PQRS no encontrada' });
        }

        res.json({ msg: 'Eliminar PQRS', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se pudo eliminar la PQRS'
        });
    }
}

export {
    createPQRS,
    getPQRS,
    getPQRSList,
    updatePQRS,
    deletePQRS
}
