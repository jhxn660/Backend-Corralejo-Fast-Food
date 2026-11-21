import CommentModel from "../models/comment.model.js";
import { ONLY_ACTIVE } from "../helpers/visibility.helper.js";

// `usuarioId` puede ser null cuando comenta un visitante sin cuenta.
const dbCreateComment = async (bodyData, usuarioId, ventaId) => {
    return await CommentModel.create({ ...bodyData, usuario: usuarioId, venta: ventaId });
};

const dbGetComment = async (id) => {
    return await CommentModel.findOne({ _id: id }).populate('usuario', 'name email');
};

// Moderación (personal): todos o filtrados por visibilidad (ver buildVisibilityFilter).
// Trae el ticket y los productos de la venta: solo Administrador y Owner ven qué
// productos se calificaron (la vista pública no los incluye).
const dbGetComments = async (filter = {}) => {
    return await CommentModel.find(filter)
        .sort({ createdAt: -1 })
        .populate('usuario', 'name email')
        .populate('venta', 'ticketId detalles.producto detalles.cantidad');
};

// Vista pública: solo comentarios visibles, sin el código del ticket ni la venta
/**
 * Comentarios visibles para la portada. Si quien pregunta tiene sesión, cada comentario trae
 * `meGusta: true/false` para pintar el botón encendido o apagado. La lista `likedBy` (quién dio
 * me gusta) nunca sale del servidor: solo se usa aquí para calcular ese booleano.
 */
const dbGetPublicComments = async (userId = null) => {
    const comments = await CommentModel.find(ONLY_ACTIVE)
        .select('comentario valoracion calificacion likes usuario isActive createdAt +likedBy')
        .sort({ createdAt: -1 })
        .populate('usuario', 'name');

    return comments.map((comment) => {
        const { likedBy = [], ...data } = comment.toObject();
        const meGusta = Boolean(userId) && likedBy.some((id) => String(id) === String(userId));

        return { ...data, meGusta };
    });
};

/**
 * Da o quita el "me gusta" de un usuario (el mismo botón hace las dos cosas).
 * Cada paso es una sola operación atómica de MongoDB, así dos clics rápidos no cuentan doble:
 *   1. Si el usuario NO está en likedBy → se agrega y likes sube 1.
 *   2. Si ya estaba → se quita y likes baja 1.
 * @returns {{ likes: number, meGusta: boolean } | null} null si el comentario no existe
 */
const dbToggleCommentLike = async (id, userId) => {
    const liked = await CommentModel.findOneAndUpdate(
        { _id: id, likedBy: { $ne: userId } },
        { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
        { returnDocument: 'after' }
    );
    if (liked) return { likes: liked.likes, meGusta: true };

    const unliked = await CommentModel.findOneAndUpdate(
        { _id: id, likedBy: userId },
        { $pull: { likedBy: userId }, $inc: { likes: -1 } },
        { returnDocument: 'after' }
    );
    if (unliked) return { likes: unliked.likes, meGusta: false };

    return null;
};

const dbUpdateComment = async (id, commentUpdate) => {
    return await CommentModel.findByIdAndUpdate(id, commentUpdate, { returnDocument: 'after', runValidators: true });
};

const dbSetCommentStatus = async (id, isActive) => {
    return await CommentModel.findByIdAndUpdate(id, { $set: { isActive } }, { returnDocument: 'after' });
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
    dbToggleCommentLike,
    dbDeleteComment,
    dbGetCommentByCodigo
};
