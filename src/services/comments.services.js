import CommentModel from "../models/comment.model.js";

// CAMBIO: los populate de `usuario` proyectan `name email` (campos reales del modelo User);
// antes pedían `nombre correo`, que no existen, y solo llegaba el _id.
// CAMBIO: recibe además la venta ya validada por el controlador. `usuarioId` puede ser null
// cuando comenta un visitante sin cuenta.
const dbCreateComment = async (bodyData, usuarioId, ventaId) => {
    const newComment = {
        ...bodyData,
        usuario: usuarioId,
        venta: ventaId
    };
    return await CommentModel.create(newComment);
}

const dbGetComment = async (id) => {
    return await CommentModel.findOne({ _id: id }).populate('usuario', 'name email');
}

const dbGetComments = async () => {
    return await CommentModel.find().populate('usuario', 'name email');
}

const dbUpdateComment = async (id, commentUpdate) => {
    return await CommentModel.findByIdAndUpdate(
        id,
        commentUpdate,
        { new: true, runValidators: true }
    );
}

const dbDeleteComment = async (id) => {
    return await CommentModel.findOneAndDelete({ _id: id });
}

// CAMBIO: permite detectar si un ticket ya se usó para comentar (un comentario por compra).
const dbGetCommentByCodigo = async (codigo) => {
    return await CommentModel.findOne({ codigo });
}

export {
    dbCreateComment,
    dbGetComment,
    dbGetComments,
    dbUpdateComment,
    dbDeleteComment,
    dbGetCommentByCodigo
}
