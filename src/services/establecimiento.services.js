import { EstablecimientoModel, HorarioModel, UbicacionModel } from "../models/establecimiento.model.js";

// ESTABLECIMIENTO
const dbCreateEstablecimiento = async (newInfo) => {
    return await EstablecimientoModel.create(newInfo);
}

const dbGetEstablecimiento = async (id) => {
    return await EstablecimientoModel.findOne({ _id: id });
}

const dbGetEstablecimientoList = async () => {
    return await EstablecimientoModel.find();
}

const dbUpdateEstablecimiento = async (id, infoUpdate) => {
    return await EstablecimientoModel.findOneAndUpdate(
        { _id: id },
        infoUpdate,
        { new: true }
    );
}

const dbDeleteEstablecimiento = async (id) => {
    return await EstablecimientoModel.findOneAndDelete({ _id: id });
}

// HORARIO
const dbCreateHorario = async (newHorario) => {
    return await HorarioModel.create(newHorario);
}

const dbGetHorario = async (id) => {
    return await HorarioModel.findOne({ _id: id });
}

const dbGetHorarios = async () => {
    return await HorarioModel.find();
}

const dbUpdateHorario = async (id, horarioUpdate) => {
    return await HorarioModel.findOneAndUpdate(
        { _id: id },
        horarioUpdate,
        { new: true }
    );
}

const dbDeleteHorario = async (id) => {
    return await HorarioModel.findOneAndDelete({ _id: id });
}

// UBICACIÓN
const dbCreateUbicacion = async (newUbicacion) => {
    return await UbicacionModel.create(newUbicacion);
}

const dbGetUbicacion = async (id) => {
    return await UbicacionModel.findOne({ _id: id });
}

const dbGetUbicaciones = async () => {
    return await UbicacionModel.find();
}

const dbUpdateUbicacion = async (id, ubicacionUpdate) => {
    return await UbicacionModel.findOneAndUpdate(
        { _id: id },
        ubicacionUpdate,
        { new: true }
    );
}

const dbDeleteUbicacion = async (id) => {
    return await UbicacionModel.findOneAndDelete({ _id: id });
}

export {
    // Establecimiento
    dbCreateEstablecimiento,
    dbGetEstablecimiento,
    dbGetEstablecimientoList,
    dbUpdateEstablecimiento,
    dbDeleteEstablecimiento,
    // Horarios
    dbCreateHorario,
    dbGetHorario,
    dbGetHorarios,
    dbUpdateHorario,
    dbDeleteHorario,
    // Ubicación
    dbCreateUbicacion,
    dbGetUbicacion,
    dbGetUbicaciones,
    dbUpdateUbicacion,
    dbDeleteUbicacion
}
