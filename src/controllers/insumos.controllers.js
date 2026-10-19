import { dbCreateInsumo, dbDeleteInsumo, dbGetInsumo, dbGetInsumos, dbUpdateInsumo } from "../services/insumos.services.js";

const createInsumo = async (req, res) => {
    try {

        const inputData = req.body;

        const data = await dbCreateInsumo(inputData);

        res.json({ msg: 'Registra Insumo', data: data });

    } catch (error) {

        console.error(error);
        res.json({ msg: 'No se pudo registrar el insumo' });

    }
}

const getInsumo = async (req, res) => {
    try {

        const id = req.params.id;

        const data = await dbGetInsumo(id);

        res.json({ msg: 'Obtiene un Insumo', data: data });

    } catch (error) {

        console.error(error);
        res.json({ msg: 'No se pudo obtener la categoria por id' });

    }
}


const getInsumos = async (req, res) => {
    try {

        const data = await dbGetInsumos();

        res.json({ msg: 'Lista de Insumos', data: data });

    } catch (error) {

        console.error(error);
        res.json({ msg: 'No se ha podido obtener los insumos' });

    }
}

const updateInsumo = async (req, res) => {
    try {

        const id = req.params.id;

        const inputData = req.body;

        const data = await dbUpdateInsumo(id, inputData);

        res.json({ msg: 'Insumo Actualizado', data: data });

    } catch (error) {

        console.error(error);
        res.json({ msg: 'No se ha podido Actualizar el Insumo'});
        
    }
}

const deleteInsumo = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteInsumo(id);

        res.json({ msg: 'Eliminar un Insumo', data: data});

    } catch (error) {

        console.error(error);
        res.json({ msg: 'No se ha podido eliminar el Insumo'});
        
    }
}


export {
    createInsumo,
    getInsumo,
    getInsumos,
    updateInsumo,
    deleteInsumo
}