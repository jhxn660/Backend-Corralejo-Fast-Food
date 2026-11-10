import ProductModel from "../models/product.model.js"

const dbCreateProduct = async( newProduct ) => {
    return await ProductModel.create( newProduct );
}

const dbGetProduct = async ( id ) => {
    return await ProductModel.findOne({ _id: id });
}

const dbGetProducts = async () => {
    // CAMBIO: `createdBy` ya resuelve contra User, así que se limita la proyección;
    // un populate sin campos devolvería el documento completo, incluido el hash de la contraseña.
    return await ProductModel.find()
        .populate('createdBy', 'name email role')
        .populate('category');
}

const dbUpdateProduct = async ( id, productUpdate ) => {
    return await ProductModel.findOneAndUpdate(
        { _id: id },
        productUpdate,
        { new: true }
    );
}

const dbDeleteProduct = async ( id ) => {
    return await ProductModel.findOneAndDelete({ _id: id });
}

export {
    dbCreateProduct, dbGetProduct, dbGetProducts, dbUpdateProduct, dbDeleteProduct
}
