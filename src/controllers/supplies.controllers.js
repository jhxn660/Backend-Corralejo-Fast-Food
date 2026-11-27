import asyncHandler from '../helpers/async-handler.helper.js';
import { assertFound } from '../helpers/http-error.helper.js';
import { dbCreateSupply, dbGetSupply, dbGetSupplies, dbUpdateSupply, dbDeleteSupply } from '../services/supplies.services.js';

const NOT_FOUND = 'Insumo no encontrado';

const createSupply = asyncHandler(async (req, res) => {
    // El creador es el usuario autenticado, nunca el que venga en el body
    const data = await dbCreateSupply({ ...req.body, createdBy: req.userFound._id });

    res.status(201).json({ msg: 'Registra Insumo', data });
}, 'No se pudo registrar el insumo');

const getSupply = asyncHandler(async (req, res) => {
    res.json({ msg: 'Obtiene un Insumo', data: assertFound(await dbGetSupply(req.params.id), NOT_FOUND) });
}, 'No se pudo obtener el insumo por id');

// ?status=Con_Stock|Sin_Stock (opcional)
const getSupplies = asyncHandler(async (req, res) => {
    res.json({ msg: 'Lista de Insumos', data: await dbGetSupplies(req.query.status) });
}, 'No se ha podido obtener los insumos');

const updateSupply = asyncHandler(async (req, res) => {
    // El autor original no cambia al editar: `createdBy` se descarta del body.
    const { createdBy, ...changes } = req.body;

    res.json({ msg: 'Insumo Actualizado', data: assertFound(await dbUpdateSupply(req.params.id, changes), NOT_FOUND) });
}, 'No se ha podido actualizar el insumo');

const deleteSupply = asyncHandler(async (req, res) => {
    res.json({ msg: 'Insumo Eliminado', data: assertFound(await dbDeleteSupply(req.params.id), NOT_FOUND) });
}, 'No se ha podido eliminar el insumo');

export {
    createSupply,
    getSupply,
    getSupplies,
    updateSupply,
    deleteSupply
};
