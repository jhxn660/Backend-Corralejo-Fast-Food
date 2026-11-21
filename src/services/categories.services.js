import CategoryModel from '../models/category.model.js';

/**
 * CAPA DE SERVICIOS. Aquí viven las consultas y las reglas de negocio. Un servicio no conoce
 * `req` ni `res`: recibe datos simples y devuelve documentos (o null si no existe). Gracias a eso
 * la misma función sirve para una ruta, para otro servicio o para una prueba.
 * Convención del proyecto: las funciones que tocan la base de datos empiezan por `db`.
 * No capturan errores: si Mongoose rechaza (validación, duplicado), el error sube solo hasta
 * el errorHandler, que lo traduce a 400.
 */

// Registrar la categoria y devolver quien la creo
const dbCreateCategory = async (newCategory) => {
    const category = await CategoryModel.create(newCategory);

    return await category.populate('createdBy', 'name email role');
};

// Obtener una categoria por su ID
const dbGetCategory = async (id) => {
    return await CategoryModel
        .findOne({ _id: id })
        .populate('createdBy', 'name email role');
};

// Listar todas las categorias
const dbGetCategories = async () => {
    return await CategoryModel
        .find()
        .populate('createdBy', 'name email role');
};

// Actualizar uno o mas campos de una categoria (PATCH)
const dbUpdateCategory = async (id, categoryUpdated) => {
    return await CategoryModel.findOneAndUpdate(
        { _id: id },
        categoryUpdated,
        {
            returnDocument: 'after',           // Devuelve el documento ya actualizado
            runValidators: true  // Aplica las reglas del modelo tambien al actualizar
        }
    );
};

// Eliminar una categoria por su ID
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
