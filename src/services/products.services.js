import ProductModel from "../models/product.model.js"

const dbCreateProduct = async( newProduct ) => {
    return await ProductModel.create( newProduct );
}

const dbGetProducts = async () => {
    return await ProductModel.find().populate(['createdBy', 'category'])
}

const dbDeleteProduct = async ( id ) => {
    return await ProductModel.findOneAndDelete({ _id: id });
}

const dbUpdateProduct = async ( id, productUpdate ) => {
    return await ProductModel.findOneAndUpdate(
        { _id: id },
        productUpdate,
        { new: true }
    );
}

const dbGetProduct = async ( id ) => {
    return await ProductModel.findOne({ _id: id });
}

export {
    dbCreateProduct, dbGetProducts, dbDeleteProduct, dbUpdateProduct, dbGetProduct
}