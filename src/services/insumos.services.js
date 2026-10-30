import InsumoModel from '../models/insumo.model.js';

// Crear un insumo
const dbCreateInsumo = async (newInsumo) => {
    return await InsumoModel.create(newInsumo);
};

// Obtener un insumo por su ID
const dbGetInsumo = async (id) => {
    return await InsumoModel.findOne({ _id: id });
};

// Listar insumos con filtro opcional por estado de stock
const dbGetInsumos = async (status) => {
    let filter = {};

    const aviableStatus = ['Con_Stock', 'Sin_Stock'];

    // Filtrar por estado (solo si se envía y es un estado válido)
    if (status && aviableStatus.includes(status)) {
        filter.status = option;
    }

    return await InsumoModel.find(filter);
};

// Actualizar un insumo por su ID
const dbUpdateInsumo = async (id, insumoUpdated) => {
    return await InsumoModel.findOneAndUpdate(
        { _id: id },
        insumoUpdated,
        { new: true }  // Devuelve el documento ya actualizado
    );
};

// Eliminar un insumo por su ID
const dbDeleteInsumo = async (id) => {
    return await InsumoModel.findOneAndDelete({ _id: id });
};

export {
    dbCreateInsumo,
    dbGetInsumo,
    dbGetInsumos,
    dbUpdateInsumo,
    dbDeleteInsumo
};