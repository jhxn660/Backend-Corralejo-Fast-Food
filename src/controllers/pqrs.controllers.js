import asyncHandler from '../helpers/async-handler.helper.js';
import { assertFound, HttpError } from '../helpers/http-error.helper.js';
import {
    dbCreatePQRS,
    dbDeletePQRS,
    dbGetPQRS,
    dbGetPQRSList,
    dbGetPQRSListByUser,
    dbUpdatePQRS
} from '../services/pqrs.services.js';

const NOT_FOUND = 'PQRS no encontrada';

// LISTAS BLANCAS: qué campos del body se aceptan en cada operación. Cualquier otro se ignora.
// - El Cliente escribe su solicitud: tipo, asunto y descripción. Autor, estado y respuesta los
//   pone el servidor (si viajaran en el body, un Cliente podría crear una PQRS "ya respondida").
// - La administración gestiona: estado y respuesta. Lo que escribió el Cliente y su autor son el
//   registro de lo que pidió; si se pudieran reescribir, la respuesta quedaría sin contexto.
const CLIENT_FIELDS = Object.freeze([ 'tipo', 'asunto', 'descripcion' ]);
const MANAGEMENT_FIELDS = Object.freeze([ 'estado', 'respuesta' ]);

const pickFields = (body, fields) => Object.fromEntries(
    fields.filter((field) => body[field] !== undefined).map((field) => [ field, body[field] ])
);

// El autor es el Cliente autenticado (la ruta solo admite ese rol); el estado lo fija el Schema ('Pendiente')
const createPQRS = asyncHandler(async (req, res) => {
    const data = await dbCreatePQRS(pickFields(req.body, CLIENT_FIELDS), req.userFound._id);

    res.status(201).json({ msg: 'Registrar PQRS', data });
}, 'No se pudo registrar la PQRS');

const getPQRS = asyncHandler(async (req, res) => {
    res.json({ msg: 'Obtener PQRS por ID', data: assertFound(await dbGetPQRS(req.params.id), NOT_FOUND) });
}, 'No se pudo obtener la PQRS');

const getPQRSList = asyncHandler(async (req, res) => {
    res.json({ msg: 'Listar total de PQRS', data: await dbGetPQRSList() });
}, 'No se pueden listar las PQRS');

// GET /api/pqrs/mine: el Cliente autenticado lee SOLO sus PQRS (la ruta solo admite ese rol).
// Quién es sale del token, nunca de la URL ni del body: nadie puede pedir las de otra persona.
const getMyPQRSList = asyncHandler(async (req, res) => {
    res.json({ msg: 'Listar mis PQRS', data: await dbGetPQRSListByUser(req.userFound._id) });
}, 'No se pueden listar tus PQRS');

// Gestión: cambiar el `estado` y/o escribir la `respuesta`. Body: { estado?, respuesta? }
const updatePQRS = asyncHandler(async (req, res) => {
    const changes = pickFields(req.body, MANAGEMENT_FIELDS);

    if (changes.respuesta !== undefined) {
        // Se exige texto: Mongoose convertiría un número en texto y un null borraría la respuesta
        if (typeof changes.respuesta !== 'string') {
            throw new HttpError(400, "El campo 'respuesta' debe ser texto", { respuesta: 'Debe ser texto' });
        }

        // Quién respondió y cuándo los registra el servidor, no el body
        changes.respondedBy = req.userFound._id;
        changes.respondedAt = new Date();
    }

    res.json({ msg: 'Actualizar PQRS', data: assertFound(await dbUpdatePQRS(req.params.id, changes), NOT_FOUND) });
}, 'No se pudo actualizar la PQRS');

const deletePQRS = asyncHandler(async (req, res) => {
    res.json({ msg: 'Eliminar PQRS', data: assertFound(await dbDeletePQRS(req.params.id), NOT_FOUND) });
}, 'No se pudo eliminar la PQRS');

export {
    createPQRS,
    getPQRS,
    getPQRSList,
    getMyPQRSList,
    updatePQRS,
    deletePQRS
};
