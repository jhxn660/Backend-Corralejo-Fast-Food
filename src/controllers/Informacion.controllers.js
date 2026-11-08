import { 
   
    dbCreateInformacion, 
    dbDeleteInformacion, 
    dbGetInformacionList, 
    dbUpdateInformacion, 
    dbGetInformacion,
    
    dbCreateHorario,
    dbDeleteHorario,
    dbGetHorarios,
    dbUpdateHorario,
    dbGetHorario,
    
    dbCreateUbicacion,
    dbDeleteUbicacion,
    dbGetUbicaciones,
    dbUpdateUbicacion,
    dbGetUbicacion
} from "../services/Informacion.services.js";

// CONTROLADORINFORMACIÓN
const createInformacion = async (req, res) => {
    try {
        const inputData = req.body;
        const data = await dbCreateInformacion(inputData);

        res.json({ msg: 'Registrar información', data: data });
    } catch (error) {
        console.error(error);

        if(error.name === 'ValidationError') {
            const errors = {};
            for( const field in error.errors ) {
                errors[field] = error.errors[field].message;
            }
            return res.json({ errors });
        }

        res.json({ msg: 'No se pudo registrar la información' });
    }
}

const getInformacionList = async (req, res) => {
    try {
        const data = await dbGetInformacionList();

        res.json({ msg: 'Listar total de información', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se puede listar la información' });
    }
}

const getInformacion = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetInformacion(query);

        res.json({ msg: 'Obtener información por ID', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo obtener la información' });
    }
}

const updateInformacion = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdateInformacion(id, inputData);

        res.json({ msg: 'Actualizar información', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo actualizar la información' });
    }
}

const deleteInformacion = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeleteInformacion(id);

        res.json({ msg: 'Eliminar información', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo eliminar la información' });
    }
}


// CONTROLADOR HORARIO
const createHorario = async (req, res) => {
    try {
        const inputData = req.body;
        const data = await dbCreateHorario(inputData);

        res.json({ msg: 'Registrar horario', data: data });
    } catch (error) {
        console.error(error);

        if(error.name === 'ValidationError') {
            const errors = {};
            for( const field in error.errors ) {
                errors[field] = error.errors[field].message;
            }
            return res.json({ errors });
        }

        res.json({ msg: 'No se pudo registrar el horario' });
    }
}

const getHorarios = async (req, res) => {
    try {
        const data = await dbGetHorarios();

        res.json({ msg: 'Listar total de horarios', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pueden listar los horarios' });
    }
}

const getHorario = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetHorario(query);

        res.json({ msg: 'Obtener horario por ID', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo obtener el horario' });
    }
}

const updateHorario = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdateHorario(id, inputData);

        res.json({ msg: 'Actualizar horario', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo actualizar el horario' });
    }
}

const deleteHorario = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeleteHorario(id);

        res.json({ msg: 'Eliminar horario', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo eliminar el horario' });
    }
}


// CONTROLADOR UBICACIÓN
const createUbicacion = async (req, res) => {
    try {
        const inputData = req.body;
        const data = await dbCreateUbicacion(inputData);

        res.json({ msg: 'Registrar ubicación', data: data });
    } catch (error) {
        console.error(error);

        if(error.name === 'ValidationError') {
            const errors = {};
            for( const field in error.errors ) {
                errors[field] = error.errors[field].message;
            }
            return res.json({ errors });
        }

        res.json({ msg: 'No se pudo registrar la ubicación' });
    }
}

const getUbicaciones = async (req, res) => {
    try {
        const data = await dbGetUbicaciones();

        res.json({ msg: 'Listar total de ubicaciones', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pueden listar las ubicaciones' });
    }
}

const getUbicacion = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetUbicacion(query);

        res.json({ msg: 'Obtener ubicación por ID', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo obtener la ubicación' });
    }
}

const updateUbicacion = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdateUbicacion(id, inputData);

        res.json({ msg: 'Actualizar ubicación', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo actualizar la ubicación' });
    }
}

const deleteUbicacion = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeleteUbicacion(id);

        res.json({ msg: 'Eliminar ubicación', data: data });
    } catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo eliminar la ubicación' });
    }
}


// EXPORTACIÓN GENERAL
export {
    // Información
    createInformacion,
    getInformacionList,
    getInformacion,
    updateInformacion,
    deleteInformacion,
    // Horarios
    createHorario,
    getHorarios,
    getHorario,
    updateHorario,
    deleteHorario,
    // Ubicación
    createUbicacion,
    getUbicaciones,
    getUbicacion,
    updateUbicacion,
    deleteUbicacion
}