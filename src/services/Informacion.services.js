import { InformacionModel, HorarioModel, UbicacionModel } from "../models/Informacion.model.js";
// INFORMACIÓN
const dbCreateInformacion = async (newInfo) => {
    return await InformacionModel.create(newInfo);
}

const dbGetInformacionList = async () => {
    return await InformacionModel.find();
}

const dbDeleteInformacion = async (id) => {
    return await InformacionModel.findOneAndDelete({ _id: id });
}

const dbUpdateInformacion = async (id, infoUpdate) => {
    return await InformacionModel.findOneAndUpdate(
        { _id: id },
        infoUpdate,
        { new: true }
    );
}

const dbGetInformacion = async (id) => {
    return await InformacionModel.findOne({ _id: id });
}



// HORARIO
const dbCreateHorario = async (newHorario) => {
    return await HorarioModel.create(newHorario);
}

const dbGetHorarios = async () => {
    return await HorarioModel.find();
}

const dbDeleteHorario = async (id) => {
    return await HorarioModel.findOneAndDelete({ _id: id });
}

const dbUpdateHorario = async (id, horarioUpdate) => {
    return await HorarioModel.findOneAndUpdate(
        { _id: id },
        horarioUpdate,
        { new: true }
    );
}

const dbGetHorario = async (id) => {
    return await HorarioModel.findOne({ _id: id });
}


// UBICACIÓN
const dbCreateUbicacion = async (newUbicacion) => {
    return await UbicacionModel.create(newUbicacion);
}

const dbGetUbicaciones = async () => {
    return await UbicacionModel.find();
}

const dbDeleteUbicacion = async (id) => {
    return await UbicacionModel.findOneAndDelete({ _id: id });
}

const dbUpdateUbicacion = async (id, ubicacionUpdate) => {
    return await UbicacionModel.findOneAndUpdate(
        { _id: id },
        ubicacionUpdate,
        { new: true }
    );
}

const dbGetUbicacion = async (id) => {
    return await UbicacionModel.findOne({ _id: id });
}

// EXPORTACIÓN GENERAL
export {
    // Información
    dbCreateInformacion,
    dbGetInformacionList,
    dbDeleteInformacion,
    dbUpdateInformacion,
    dbGetInformacion,
    // Horarios
    dbCreateHorario,
    dbGetHorarios,
    dbDeleteHorario,
    dbUpdateHorario,
    dbGetHorario,
    // Ubicación
    dbCreateUbicacion,
    dbGetUbicaciones,
    dbDeleteUbicacion,
    dbUpdateUbicacion,
    dbGetUbicacion
}