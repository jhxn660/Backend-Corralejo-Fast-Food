import CategoryModel from "../models/category.model.js"

const dbCreateCategory = async ( newCategory ) => {
    return await CategoryModel.create( newCategory ); // Registrar en la Base de Datos (BD)
}

export {
    dbCreateCategory

}