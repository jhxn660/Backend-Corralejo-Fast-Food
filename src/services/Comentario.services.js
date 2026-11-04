import ComentarioModel from "../models/Comentario.model.js";

const dbCreateComentario = async (bodyData, usuarioId) => {
    // Combinamos los datos que envía el cliente con el ID del usuario autenticado
    const nuevoComentario = {
        ...bodyData,
        usuario: usuarioId
    };
    return await ComentarioModel.create(nuevoComentario);
}

const dbGetComentarios = async () => {
    return await ComentarioModel.find().populate('usuario', 'nombre correo');
}

const dbDeleteComentario = async (id) => {
    return await ComentarioModel.findOneAndDelete({ _id: id });
}

const dbUpdateComentario = async (id, comentarioUpdate) => {
    return await ComentarioModel.findByIdAndUpdate(
        id, 
        comentarioUpdate, 
        { new: true, runValidators: true }
    );
}

const dbGetComentario = async (id) => {
    return await ComentarioModel.findOne({ _id: id }).populate('usuario', 'nombre correo');
}

export {
    dbCreateComentario,
    dbGetComentarios,
    dbDeleteComentario,
    dbUpdateComentario,
    dbGetComentario
}