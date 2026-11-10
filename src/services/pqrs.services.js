import PQRSModel from "../models/pqrs.model.js";

// CAMBIO: los populate de `usuario` proyectan `name email` (campos reales del modelo User);
// antes pedían `nombre correo`, que no existen, y solo llegaba el _id.
const dbCreatePQRS = async (bodyData, usuarioId) => {
    // 1. Creamos la PQRS con el ID del usuario autenticado
    const nuevoPQRS = new PQRSModel({
        ...bodyData,
        usuario: usuarioId
    });
    const pqrsGuardada = await nuevoPQRS.save();

    // 2. probamos los datos del usuario (_id, name, email) para devolverlos en la respuesta
    return await PQRSModel.findById(pqrsGuardada._id).populate('usuario', '_id name email');
}

const dbGetPQRS = async (id) => {
    return await PQRSModel.findOne({ _id: id }).populate('usuario', '_id name email');
}

const dbGetPQRSList = async () => {
    // Trae el listado completo incluyendo el _id, name y email del usuario
    return await PQRSModel.find().populate('usuario', '_id name email');
}

const dbUpdatePQRS = async (id, pqrsUpdate) => {
    return await PQRSModel.findOneAndUpdate(
        { _id: id },
        pqrsUpdate,
        { new: true, runValidators: true }
    );
}

const dbDeletePQRS = async (id) => {
    return await PQRSModel.findOneAndDelete({ _id: id });
}

export {
    dbCreatePQRS,
    dbGetPQRS,
    dbGetPQRSList,
    dbUpdatePQRS,
    dbDeletePQRS
}
