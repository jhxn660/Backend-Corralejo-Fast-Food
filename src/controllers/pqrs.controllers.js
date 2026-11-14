import asyncHandler from "../helpers/async-handler.helper.js";
import { assertFound } from "../helpers/http-error.helper.js";
import { dbCreatePQRS, dbDeletePQRS, dbGetPQRS, dbGetPQRSList, dbUpdatePQRS } from "../services/pqrs.services.js";

const NOT_FOUND = 'PQRS no encontrada';

// El autor es el Cliente autenticado (la ruta solo admite ese rol); el estado lo fija el Schema ('Pendiente')
const createPQRS = asyncHandler(async (req, res) => {
    const { usuario, estado, ...bodyData } = req.body;
    const data = await dbCreatePQRS(bodyData, req.userFound._id);

    res.status(201).json({ msg: 'Registrar PQRS', data });
}, 'No se pudo registrar la PQRS');

const getPQRS = asyncHandler(async (req, res) => {
    res.json({ msg: 'Obtener PQRS por ID', data: assertFound(await dbGetPQRS(req.params.id), NOT_FOUND) });
}, 'No se pudo obtener la PQRS');

const getPQRSList = asyncHandler(async (req, res) => {
    res.json({ msg: 'Listar total de PQRS', data: await dbGetPQRSList() });
}, 'No se pueden listar las PQRS');

// Gestión: normalmente cambia `estado`. El autor no se reasigna.
const updatePQRS = asyncHandler(async (req, res) => {
    const { usuario, ...changes } = req.body;

    res.json({ msg: 'Actualizar PQRS', data: assertFound(await dbUpdatePQRS(req.params.id, changes), NOT_FOUND) });
}, 'No se pudo actualizar la PQRS');

const deletePQRS = asyncHandler(async (req, res) => {
    res.json({ msg: 'Eliminar PQRS', data: assertFound(await dbDeletePQRS(req.params.id), NOT_FOUND) });
}, 'No se pudo eliminar la PQRS');

export {
    createPQRS,
    getPQRS,
    getPQRSList,
    updatePQRS,
    deletePQRS
};
