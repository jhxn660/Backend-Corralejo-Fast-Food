import CategoryModel from "../models/category.model.js"

const dbCreateCategory = async ( newCategory ) => {
    return await CategoryModel.create( newCategory ); // Registrar en la Base de Datos (BD)
}

const dbGetCategories = async () => {
    return await CategoryModel.find({ status: true }); // Consultar todas las categorias registradas
}

const dbUpdateCategory = async () => {
    return await CategoryModel
}

const dbDeleteCategory = () => {}

export {
    dbCreateCategory,
    dbGetCategories,
    dbUpdateCategory,
    dbDeleteCategory
}