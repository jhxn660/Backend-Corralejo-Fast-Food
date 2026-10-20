import CategoryModel from "../models/category.model.js"

const dbCreateCategory = async ( newCategory ) => {
    return await CategoryModel.create( newCategory ); // Registrar en la Base de Datos (BD)
}

const dbGetCategory = async ( id ) => {
    // return await CategoryModel.findById( id );   // Obtiene una categoria por su ID
    return await CategoryModel.findOne({ _id: id });
}

const dbGetCategories = async () => {
    // return await CategoryModel.find({ status: true }); // Si el status en el codigo se determina true solamente trae lo indicado (true)
    return await CategoryModel.find().populate( 'createdBy' ); // Consultar todas las categorias registradas
}                      // Poblar los campos                                 

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

export {
    dbCreateCategory,
    dbGetCategory,
    dbGetCategories,
    dbUpdateCategory,
    dbDeleteCategory
}