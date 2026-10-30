import CategoryModel from '../models/category.model.js';

// Registrar en la Base de Datos (BD)
const dbCreateCategory = async (newCategory) => {
    return await CategoryModel.create(newCategory);
};

// Obtiene una categoria por su ID
const dbGetCategory = async (id) => {
    return await CategoryModel.findOne({ _id: id });
};

// Consultar todas las categorias registradas, poblando los campos
const dbGetCategories = async () => {
    return await CategoryModel.find().populate('createdBy');
};

// Se usa PATCH aca para cambiar uno o mas datos de la coleccion
// "id" que se desea actualizar
// "categoryUpdated" objeto donde entrara el parametro de la categoria actualizada
// { new: true } configuracion para que retorne el documento actualizado
const dbUpdateCategory = async (id, categoryUpdated) => {
    return await CategoryModel.findOneAndUpdate(
        { _id: id },
        categoryUpdated,
        { new: true }
    );
};

// Puede eliminarse por nombre, id, etc...
const dbDeleteCategory = async (id) => {
    return await CategoryModel.findOneAndDelete({ _id: id });
};

export {
    dbCreateCategory,
    dbGetCategory,
    dbGetCategories,
    dbUpdateCategory,
    dbDeleteCategory
};