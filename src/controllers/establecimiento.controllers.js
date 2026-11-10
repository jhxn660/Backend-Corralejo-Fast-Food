import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import {
    dbCreateEstablecimiento,
    dbGetEstablecimiento,
    dbGetEstablecimientoList,
    dbUpdateEstablecimiento,
    dbDeleteEstablecimiento,
    dbCreateHorario,
    dbGetHorario,
    dbGetHorarios,
    dbUpdateHorario,
    dbDeleteHorario,
    dbCreateUbicacion,
    dbGetUbicacion,
    dbGetUbicaciones,
    dbUpdateUbicacion,
    dbDeleteUbicacion
} from "../services/establecimiento.services.js";

// ESTABLECIMIENTO
const createEstablecimiento = async (req, res) => {
    try {
        const inputData = req.body;
        const data = await dbCreateEstablecimiento(inputData);

        res.status(201).json({ msg: 'Registrar información', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo registrar la información' });
    }
}

const getEstablecimiento = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetEstablecimiento(query);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Información no encontrada' });
        }

        res.json({ msg: 'Obtener información por ID', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo obtener la información' });
    }
}

const getEstablecimientoList = async (req, res) => {
    try {
        const data = await dbGetEstablecimientoList();

        res.json({ msg: 'Listar total de información', data: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'No se puede listar la información' });
    }
}

const updateEstablecimiento = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdateEstablecimiento(id, inputData);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Información no encontrada' });
        }

        res.json({ msg: 'Actualizar información', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo actualizar la información' });
    }
}

const deleteEstablecimiento = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeleteEstablecimiento(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Información no encontrada' });
        }

        res.json({ msg: 'Eliminar información', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo eliminar la información' });
    }
}

// HORARIO
const createHorario = async (req, res) => {
    try {
        const inputData = req.body;
        const data = await dbCreateHorario(inputData);

        res.status(201).json({ msg: 'Registrar horario', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo registrar el horario' });
    }
}

const getHorario = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetHorario(query);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Horario no encontrado' });
        }

        res.json({ msg: 'Obtener horario por ID', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo obtener el horario' });
    }
}

const getHorarios = async (req, res) => {
    try {
        const data = await dbGetHorarios();

        res.json({ msg: 'Listar total de horarios', data: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'No se pueden listar los horarios' });
    }
}

const updateHorario = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdateHorario(id, inputData);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Horario no encontrado' });
        }

        res.json({ msg: 'Actualizar horario', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo actualizar el horario' });
    }
}

const deleteHorario = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeleteHorario(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Horario no encontrado' });
        }

        res.json({ msg: 'Eliminar horario', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo eliminar el horario' });
    }
}

// UBICACIÓN
const createUbicacion = async (req, res) => {
    try {
        const inputData = req.body;
        const data = await dbCreateUbicacion(inputData);

        res.status(201).json({ msg: 'Registrar ubicación', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo registrar la ubicación' });
    }
}

const getUbicacion = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetUbicacion(query);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Ubicación no encontrada' });
        }

        res.json({ msg: 'Obtener ubicación por ID', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo obtener la ubicación' });
    }
}

const getUbicaciones = async (req, res) => {
    try {
        const data = await dbGetUbicaciones();

        res.json({ msg: 'Listar total de ubicaciones', data: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'No se pueden listar las ubicaciones' });
    }
}

const updateUbicacion = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdateUbicacion(id, inputData);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Ubicación no encontrada' });
        }

        res.json({ msg: 'Actualizar ubicación', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo actualizar la ubicación' });
    }
}

const deleteUbicacion = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeleteUbicacion(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Ubicación no encontrada' });
        }

        res.json({ msg: 'Eliminar ubicación', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo eliminar la ubicación' });
    }
}

export {
    // Establecimiento
    createEstablecimiento,
    getEstablecimiento,
    getEstablecimientoList,
    updateEstablecimiento,
    deleteEstablecimiento,
    // Horarios
    createHorario,
    getHorario,
    getHorarios,
    updateHorario,
    deleteHorario,
    // Ubicación
    createUbicacion,
    getUbicacion,
    getUbicaciones,
    updateUbicacion,
    deleteUbicacion
}
