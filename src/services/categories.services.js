import CategoryModel from "../models/categories.model.js"

const dbCreateCategory = async ( newCategory) => {
    return await CategoryModel.create(newCategory);     // Registrar en la BD
}

const dbGetCategories = async () => {
    return await CategoryModel.find({ status: true });  // Consultar todas las categorias registradas
}

const dbDeleteCategory = async ( id ) => {
    // return await CategoryModel.findByIdAndDelete( id );
    return await CategoryModel.findOneAndDelete({ _id: id });
}

const dbUpdateCategory = async ( id, categoryUpdate ) => {
    // return await CategoryModel.findByIdAndUpdate(
    //    id,                 // El id del documento que deseamos actualizar
    //    categoryUpdate,     // El objeto con los datos del Documento que deseamos actualizar
    //    { new: true }       // Configuracion para que retorne el documento actualizado
    // );

    return await CategoryModel.findOneAndUpdate(
        { _id: id },
        categoryUpdate,
        { new: true }
    );
}

const dbGetCategory = async ( id ) => {
    // return await CategoryModel.findById( id );       // Obtiene una categoria por ID
    return await CategoryModel.findOne({ _id: id });
}

export {
    dbCreateCategory,
    dbGetCategories,
    dbDeleteCategory,
    dbUpdateCategory,
    dbGetCategory
}