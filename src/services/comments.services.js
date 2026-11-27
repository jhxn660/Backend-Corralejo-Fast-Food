import { ONLY_ACTIVE } from '../helpers/visibility.helper.js';
import CommentModel from '../models/comment.model.js';

// `usuarioId` puede ser null cuando comenta un visitante sin cuenta.
const dbCreateComment = async (bodyData, usuarioId, ventaId) => {
    return await CommentModel.create({ ...bodyData, usuario: usuarioId, venta: ventaId });
};

const dbGetComment = async (id) => {
    return await CommentModel.findOne({ _id: id }).populate('usuario', 'name email');
};

// Moderación (personal): todos o filtrados por visibilidad (ver buildVisibilityFilter).
// Trae el ticket y los productos de la venta: solo el personal ve qué productos se calificaron
// (la vista pública no los incluye).
const dbGetComments = async (filter = {}) => {
    return await CommentModel.find(filter)
        .sort({ createdAt: -1 })
        .populate('usuario', 'name email')
        .populate('venta', 'ticketId detalles.producto detalles.cantidad');
};

/**
 * Vista pública: solo comentarios visibles, sin el código del ticket ni la venta.
 * `likedByMe` dice si quien pide (cuando trae sesión) ya le dio "me gusta" a cada comentario.
 * La lista `likedBy` se lee para calcularlo, pero nunca sale del backend: es de quién dio cada uno.
 */
const dbGetPublicComments = async (usuarioId = null) => {
    const comments = await CommentModel.find(ONLY_ACTIVE)
        .select('comentario valoracion calificacion likes likedBy usuario status createdAt')
        .sort({ createdAt: -1 })
        .populate('usuario', 'name')
        .lean();

    return comments.map(({ likedBy = [], ...comment }) => ({
        ...comment,
        likedByMe: Boolean(usuarioId) && likedBy.some((id) => id.equals(usuarioId))
    }));
};

// Lo que responden las rutas de "me gusta": el contador y si quien pidió lo tiene dado
const toLikeSummary = (comment, likedByMe) => (comment ? { _id: comment._id, likes: comment.likes, likedByMe } : null);

// Un comentario que se puede valorar: existe y está visible (uno oculto por moderación no se toca)
const dbGetVisibleComment = async (id) => {
    return await CommentModel.findOne({ _id: id, ...ONLY_ACTIVE });
};

/**
 * Da "me gusta" (POST /:id/like). Es UNA operación atómica: el filtro `likedBy: { $ne: usuarioId }`
 * solo encuentra el comentario si esa persona aún no lo había dado; entonces la añade a likedBy y
 * suma 1. Dos clics seguidos, o dos pestañas a la vez, no cuentan doble.
 * Si no se actualizó nada, o ya lo tenía dado (se responde igual: idempotente) o el comentario no
 * existe / está oculto (null → 404).
 */
const dbLikeComment = async (id, usuarioId) => {
    const liked = await CommentModel.findOneAndUpdate(
        { _id: id, ...ONLY_ACTIVE, likedBy: { $ne: usuarioId } },
        { $addToSet: { likedBy: usuarioId }, $inc: { likes: 1 } },
        { returnDocument: 'after' }
    );

    return toLikeSummary(liked ?? await dbGetVisibleComment(id), true);
};

/**
 * Quita el "me gusta" (DELETE /:id/like). El espejo de dbLikeComment: el filtro `likedBy: usuarioId`
 * solo encuentra el comentario si esa persona lo había dado; entonces la quita y resta 1. Así el
 * contador nunca baja por alguien que no lo dio.
 */
const dbUnlikeComment = async (id, usuarioId) => {
    const unliked = await CommentModel.findOneAndUpdate(
        { _id: id, ...ONLY_ACTIVE, likedBy: usuarioId },
        { $pull: { likedBy: usuarioId }, $inc: { likes: -1 } },
        { returnDocument: 'after' }
    );

    return toLikeSummary(unliked ?? await dbGetVisibleComment(id), false);
};

const dbUpdateComment = async (id, commentUpdate) => {
    return await CommentModel.findByIdAndUpdate(id, commentUpdate, { returnDocument: 'after', runValidators: true });
};

const dbSetCommentStatus = async (id, status) => {
    return await CommentModel.findByIdAndUpdate(id, { $set: { status } }, { returnDocument: 'after' });
};

const dbDeleteComment = async (id) => {
    return await CommentModel.findOneAndDelete({ _id: id });
};

// Permite detectar si un ticket ya se usó para comentar (un comentario por compra).
const dbGetCommentByCodigo = async (codigo) => {
    return await CommentModel.findOne({ codigo });
};

export {
    dbCreateComment,
    dbGetComment,
    dbGetComments,
    dbGetPublicComments,
    dbUpdateComment,
    dbSetCommentStatus,
    dbDeleteComment,
    dbGetCommentByCodigo,
    dbLikeComment,
    dbUnlikeComment
};
