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

export {
    dbCreateCategory,
    dbGetCategories,
    dbDeleteCategory
}