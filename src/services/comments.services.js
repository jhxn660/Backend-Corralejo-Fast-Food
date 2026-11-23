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
const dbGetPublicComments = async () => {
    return await CommentModel.find(ONLY_ACTIVE)
        .select('comentario valoracion calificacion likes usuario isActive createdAt')
        .sort({ createdAt: -1 })
        .populate('usuario', 'name');
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
    dbDeleteComment,
    dbGetCommentByCodigo
};
