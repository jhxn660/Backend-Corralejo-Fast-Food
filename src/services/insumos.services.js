import InsumoModel from "../models/insumo.model.js"

const dbCreateInsumo = async ( newInsumo ) => {
    return await InsumoModel.create( newInsumo );
}

const dbGetInsumo = async ( id ) => {
    return await InsumoModel.findOne({ _id: id });
}

const dbGetInsumos = async (status) => {
    let filter = {};

    const aviableStatus = ['Con_Stock', 'Sin_Stock']

    if( status && aviableStatus.includes( status ) ) {
        filter.status = option;
    }

    return await InsumoModel.find( filter ); // Consultar todos los insumos registrados
}

const dbUpdateInsumo = async ( id, insumoUpdated ) => {
    return await InsumoModel.findOneAndUpdate({ _id: id }, insumoUpdated, { new: true});
}

const dbDeleteInsumo = async ( id ) => {
    return await InsumoModel.findOneAndDelete({ _id: id});
}

export {
    dbCreateInsumo,
    dbGetInsumo,
    dbGetInsumos,
    dbUpdateInsumo,
    dbDeleteInsumo
}