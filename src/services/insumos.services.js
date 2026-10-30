import InsumoModel from '../models/insumo.model.js';

// Crear un insumo y devolver su categoria y quien lo creo
const dbCreateInsumo = async (newInsumo) => {
    const insumo = await InsumoModel.create(newInsumo);

    return await insumo.populate([
        { path: 'category', select: 'name' },
        { path: 'createdBy', select: 'name email role' }
    ]);
};

// Obtener un insumo por su ID
const dbGetInsumo = async (id) => {
    return await InsumoModel
        .findOne({ _id: id })
        .populate('category', 'name')
        .populate('createdBy', 'name email role');
};

// Listar insumos con filtro opcional por estado de stock
const dbGetInsumos = async (state) => {
    let filter = {};

    const availableStates = ['Con_Stock', 'Sin_Stock'];

    // Filtrar por estado (solo si se envia y es un estado valido)
    if (state && availableStates.includes(state)) {
        filter.state = state;
    }

    return await InsumoModel
        .find(filter)
        .populate('category', 'name')
        .populate('createdBy', 'name email role');
};

// Actualizar un insumo por su ID
const dbUpdateInsumo = async (id, insumoUpdated) => {
    return await InsumoModel.findOneAndUpdate(
        { _id: id },
        insumoUpdated,
        {
            new: true,           // Devuelve el documento ya actualizado
            runValidators: true  // Aplica las reglas del modelo tambien al actualizar
        }
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