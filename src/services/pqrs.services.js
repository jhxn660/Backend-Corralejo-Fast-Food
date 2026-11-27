import PQRSModel from '../models/pqrs.model.js';

// Del autor solo viaja lo necesario para mostrarlo (nunca el hash de la contraseña)
const AUTHOR = [ 'usuario', '_id name email' ];

const dbCreatePQRS = async (bodyData, usuarioId) => {
    const pqrs = await PQRSModel.create({ ...bodyData, usuario: usuarioId });

    return await pqrs.populate(...AUTHOR);
};

const dbGetPQRS = async (id) => {
    return await PQRSModel.findOne({ _id: id }).populate(...AUTHOR);
};

const dbGetPQRSList = async () => {
    return await PQRSModel.find().sort({ createdAt: -1 }).populate(...AUTHOR);
};

// Las PQRS de UN usuario (GET /api/pqrs/mine). Misma forma que el listado del personal, salvo
// `respondedBy`: el Cliente ve la respuesta y su fecha, no qué cuenta del personal la escribió.
const dbGetPQRSListByUser = async (usuarioId) => {
    return await PQRSModel.find({ usuario: usuarioId })
        .select('-respondedBy')
        .sort({ createdAt: -1 })
        .populate(...AUTHOR);
};

const dbUpdatePQRS = async (id, pqrsUpdate) => {
    return await PQRSModel.findOneAndUpdate(
        { _id: id },
        pqrsUpdate,
        { returnDocument: 'after', runValidators: true }
    ).populate(...AUTHOR);
};

const dbDeletePQRS = async (id) => {
    return await PQRSModel.findOneAndDelete({ _id: id });
};

export {
    dbCreatePQRS,
    dbGetPQRS,
    dbGetPQRSList,
    dbGetPQRSListByUser,
    dbUpdatePQRS,
    dbDeletePQRS
};
