import PQRSModel from "../models/PQRS.model.js";

const dbCreatePQRS = async (bodyData, usuarioId) => {
    // 1. Creamos la PQRS con el ID del usuario autenticado
    const nuevoPQRS = new PQRSModel({
        ...bodyData,
        usuario: usuarioId
    });
    const pqrsGuardada = await nuevoPQRS.save();

    // 2. probamos los datos del usuario (_id, nombre, correo) para devolverlos en la respuesta
    return await PQRSModel.findById(pqrsGuardada._id).populate('usuario', '_id nombre correo');
}

const dbGetPQRSList = async () => {
    // Trae el listado completo incluyendo el _id, nombre y correo del usuario
    return await PQRSModel.find().populate('usuario', '_id nombre correo');
}

const dbDeletePQRS = async (id) => {
    return await PQRSModel.findOneAndDelete({ _id: id });
}

const dbUpdatePQRS = async (id, pqrsUpdate) => {
    return await PQRSModel.findOneAndUpdate(
        { _id: id },
        pqrsUpdate,
        { new: true, runValidators: true }
    );
}

const dbGetPQRS = async (id) => {
    return await PQRSModel.findOne({ _id: id }).populate('usuario', '_id nombre correo');
}

export {
    dbCreatePQRS,
    dbGetPQRSList,
    dbDeletePQRS,
    dbUpdatePQRS,
    dbGetPQRS
}