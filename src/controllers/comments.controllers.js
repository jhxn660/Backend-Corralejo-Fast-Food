import { ROLES } from '../config/roles.config.js';
import asyncHandler from '../helpers/async-handler.helper.js';
import { assertFound, HttpError } from '../helpers/http-error.helper.js';
import { buildVisibilityFilter, parseStatusBody } from '../helpers/visibility.helper.js';
import {
    dbCreateComment,
    dbDeleteComment,
    dbGetComment,
    dbGetCommentByCodigo,
    dbGetComments,
    dbGetPublicComments,
    dbLikeComment,
    dbSetCommentStatus,
    dbUnlikeComment,
    dbUpdateComment
} from '../services/comments.services.js';
import { dbReadSaleByQr } from '../services/sales.services.js';

const NOT_FOUND = 'Comentario no encontrado';

// La creación de comentarios se valida contra el ticket de compra.
// El Frontend solo lee el QR y envía su contenido en `codigo`; toda la verificación ocurre aquí:
//   1. Quién comenta: visitante sin cuenta ('Usuario', sin token) o 'Cliente' autenticado.
//   2. El código debe corresponder al `qr` de una venta registrada.
//   3. Cada ticket admite un único comentario.
const createComment = asyncHandler(async (req, res) => {
    // `valoracion` (1-10) es la escala del Frontend; `calificacion` (1-5) se
    // sigue aceptando por compatibilidad y, si falta, la deriva el modelo.
    const { codigo, comentario, calificacion, valoracion } = req.body;

    // optionalAuthMiddleware deja req.userFound solo si la petición trae un token válido
    const user = req.userFound ?? null;

    if (user && user.role !== ROLES.CLIENT) {
        throw new HttpError(403, `Error: El Rol ${user.role} no esta autorizado para publicar comentarios`);
    }

    // Se exige string: un objeto como { "$ne": null } en el body se convertiría en un
    // operador de consulta de Mongo y haría coincidir cualquier venta.
    if (typeof codigo !== 'string' || !codigo.trim()) {
        throw new HttpError(400, 'Debe enviar el código leído del QR del ticket de compra', {
            codigo: 'Debe enviar el código leído del QR del ticket de compra'
        });
    }

    const ticket = codigo.trim();

    // La venta del QR y el comentario que ya lo usó se buscan a la vez; se revisan en el orden de siempre
    const [ saleFound, usedComment ] = await Promise.all([ dbReadSaleByQr(ticket), dbGetCommentByCodigo(ticket) ]);
    const sale = assertFound(saleFound, 'El código QR no corresponde a ninguna venta registrada');

    if (usedComment) {
        throw new HttpError(400, 'Este ticket de compra ya fue utilizado para publicar un comentario');
    }

    // Solo se pasan los campos que el cliente puede definir; usuario, venta, likes e
    // status los fija el Backend para que no puedan falsificarse desde el body.
    const data = await dbCreateComment(
        { codigo: ticket, comentario, calificacion, valoracion },
        user?._id ?? null,
        sale._id
    );

    res.status(201).json({ msg: 'Registrar comentario', data });
}, 'No se pudo registrar el comentario');

const getComment = asyncHandler(async (req, res) => {
    res.json({ msg: 'Obtener comentario por ID', data: assertFound(await dbGetComment(req.params.id), NOT_FOUND) });
}, 'No se pudo obtener el comentario');

// Moderación: ?status=true|false|all (por defecto all)
const getComments = asyncHandler(async (req, res) => {
    const data = await dbGetComments(buildVisibilityFilter(req.query.status));

    res.json({ msg: 'Listar total de comentarios', data });
}, 'No se pueden listar los comentarios');

// Para la vista pública: el Backend ya excluye los ocultos. Con sesión (optionalAuthMiddleware),
// cada comentario trae `likedByMe`: si esa persona ya le dio "me gusta".
const getPublicComments = asyncHandler(async (req, res) => {
    res.json({ msg: 'Comentarios visibles', data: await dbGetPublicComments(req.userFound?._id) });
}, 'No se pueden listar los comentarios visibles');

const updateComment = asyncHandler(async (req, res) => {
    // El ticket, la venta y el autor se fijan al crear el comentario; la visibilidad tiene
    // su propio endpoint. Se descartan del body para que no puedan alterarse por aquí.
    // Los "me gusta" tampoco: son de quien los da (POST / DELETE /:id/like).
    const { codigo, venta, usuario, status, likes, likedBy, ...changes } = req.body;
    const data = assertFound(await dbUpdateComment(req.params.id, changes), NOT_FOUND);

    res.json({ msg: 'Actualizar comentario', data });
}, 'No se pudo actualizar el comentario');

// PATCH /:id/status  { "status": true | false }
const setCommentStatus = asyncHandler(async (req, res) => {
    const status = parseStatusBody(req.body);
    const data = assertFound(await dbSetCommentStatus(req.params.id, status), NOT_FOUND);

    res.json({ msg: status ? 'Comentario visible' : 'Comentario oculto', data });
}, 'No se pudo cambiar el estado del comentario');

const deleteComment = asyncHandler(async (req, res) => {
    res.json({ msg: 'Eliminar comentario', data: assertFound(await dbDeleteComment(req.params.id), NOT_FOUND) });
}, 'No se pudo eliminar el comentario');

// POST /:id/like: quien da el "me gusta" es el usuario del token, nunca un dato del body.
// Responde { _id, likes, likedByMe }. Repetirlo no suma otra vez.
const likeComment = asyncHandler(async (req, res) => {
    const data = assertFound(await dbLikeComment(req.params.id, req.userFound._id), NOT_FOUND);

    res.json({ msg: 'Me gusta registrado', data });
}, 'No se pudo registrar el me gusta');

// DELETE /:id/like: quita el "me gusta" de quien hace la petición. Repetirlo no resta otra vez.
const unlikeComment = asyncHandler(async (req, res) => {
    const data = assertFound(await dbUnlikeComment(req.params.id, req.userFound._id), NOT_FOUND);

    res.json({ msg: 'Me gusta retirado', data });
}, 'No se pudo retirar el me gusta');

export {
    createComment,
    getComment,
    getComments,
    getPublicComments,
    updateComment,
    setCommentStatus,
    deleteComment,
    likeComment,
    unlikeComment
};
