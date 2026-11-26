import SupplyModel from '../models/supply.model.js';

// Crear un insumo y devolver su categoria y quien lo creo
const dbCreateSupply = async (newSupply) => {
    const supply = await SupplyModel.create(newSupply);

    return await supply.populate([
        { path: 'category', select: 'name' },
        { path: 'createdBy', select: 'name email role' }
    ]);
};

const dbGetSupply = async (id) => {
    return await SupplyModel
        .findOne({ _id: id })
        .populate('category', 'name')
        .populate('createdBy', 'name email role');
};

// Listar insumos con filtro opcional por estado de stock
const dbGetSupplies = async (status) => {
    let filter = {};

    const availableStates = ['Con_Stock', 'Sin_Stock'];

    // Filtrar por estado (solo si se envia y es un estado valido)
    if (status && availableStates.includes(status)) {
        filter.status = status;
    }

    return await SupplyModel
        .find(filter)
        .populate('category', 'name')
        .populate('createdBy', 'name email role');
};

const dbUpdateSupply = async (id, supplyUpdated) => {
    return await SupplyModel.findOneAndUpdate(
        { _id: id },
        supplyUpdated,
        {
            returnDocument: 'after',           // Devuelve el documento ya actualizado
            runValidators: true  // Aplica las reglas del modelo tambien al actualizar
        }
    );
};

const dbDeleteSupply = async (id) => {
    return await SupplyModel.findOneAndDelete({ _id: id });
};

export {
    dbCreateSupply,
    dbGetSupply,
    dbGetSupplies,
    dbUpdateSupply,
    dbDeleteSupply
};
