import { 
    dbCreatePQRS, 
    dbDeletePQRS, 
    dbGetPQRSList, 
    dbUpdatePQRS, 
    dbGetPQRS 
} from "../services/PQRS.services.js";

const createPQRS = async (req, res) => {
    try {
        // 1. Obtenemos el ID del usuario autenticado a través del token
        const usuarioId = req.usuario ? req.usuario._id : req.uid;

        // 2. Extraemos los datos del body de manera limpia
        const bodyData = req.body;

        // 3. Enviamos ambos parámetros por separado al servicio
        const data = await dbCreatePQRS(bodyData, usuarioId);

        res.json({ msg: 'Registrar PQRS', data: data });
    } catch (error) {
        console.error(error);

        if(error.name === 'ValidationError') {
            const errors = {};
            for( const field in error.errors ) {
                errors[field] = error.errors[field].message;
            }
            return res.json({ errors });
        }

        res.json({ msg: 'No se pudo registrar la PQRS' });
    }
}

const getPQRSList = async (req, res) => {
    try {
        const data = await dbGetPQRSList();

        res.json({ msg: 'Listar total de PQRS', data: data });
    } catch (error) {
        console.error(error);
        res.json({
            msg: 'No se pueden listar las PQRS'
        });
    }
}

const getPQRS = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetPQRS(query);

        res.json({ msg: 'Obtener PQRS por ID', data: data });
    } catch (error) {
        console.error(error);
        res.json({
            msg: 'No se pudo obtener la PQRS'
        });
    }
}

const updatePQRS = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdatePQRS(id, inputData);

        res.json({ msg: 'Actualizar PQRS', data: data });
    } catch (error) {
        console.error(error);
        res.json({
            msg: 'No se pudo actualizar la PQRS'
        });
    }
}

const deletePQRS = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeletePQRS(id);

        res.json({ msg: 'Eliminar PQRS', data: data });
    } catch (error) {
        console.error(error);
        res.json({
            msg: 'No se pudo eliminar la PQRS'
        });
    }
}

export {
    createPQRS,
    getPQRSList,
    getPQRS,
    updatePQRS,
    deletePQRS
}