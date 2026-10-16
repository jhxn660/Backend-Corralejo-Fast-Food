import CategoryModel from "../models/category.model.js"

const dbCreateCategory = async ( newCategory ) => {
    return await CategoryModel.create( newCategory ); // Registrar en la Base de Datos (BD)
}

const dbGetCategories = async () => {
    return await CategoryModel.find({ status: true }); // Consultar todas las categorias registradas
}

// Se usa PATCH acá para cambiar uno o mas datos de la colección
// "id" que se desea actualizar, 
// "categoryUpdated" objeto donde entrara el parametro de la ategoria actualizada
// {new: true} Configuración para que retorne el documento actualizado
const dbUpdateCategory = async ( id, categoryUpdated ) => {
    // return await CategoryModel.findByIdAndUpdate( id, categoryUpdated, { new: true} );
    return await CategoryModel.findOneAndUpdate({_id: id}, categoryUpdated, { new: true });
}

//
const dbDeleteCategory = async ( id ) => {
    // return await CategoryModel.findByIdAndDelete( id );  // Solamente se usa el id
    return await CategoryModel.findOneAndDelete({ _id: id}); // Puede eliminarse por nombre, id etc...
}

const dbGetCategory = async ( id ) => {
    // return await CategoryModel.findById( id );   // Obtiene una categoria por su ID
    return await CategoryModel.findOne({ _id: id });

}

export {
    dbCreateCategory,
    dbGetCategories,
    dbUpdateCategory,
    dbDeleteCategory,
    dbGetCategory
}