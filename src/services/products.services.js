import ProductModel from "../models/product.model.js";
import { dbAssertRecipeSupplies } from "./supplies.services.js";
import { ONLY_ACTIVE } from "../helpers/visibility.helper.js";

// `createdBy` resuelve contra User: se limita la proyección para no exponer el hash de la contraseña.
const withRelations = (query) => query
    .populate('category', 'name type')
    .populate('createdBy', 'name email role');

const dbCreateProduct = async (newProduct) => {
    if (newProduct.receta) await dbAssertRecipeSupplies(newProduct.receta);

    return await ProductModel.create(newProduct);
};

const dbGetProduct = async (id) => {
    return await withRelations(ProductModel.findOne({ _id: id }));
};

// Gestión: todos los productos o filtrados por visibilidad (ver buildVisibilityFilter)
const dbGetProducts = async (filter = {}) => {
    return await withRelations(ProductModel.find(filter).sort({ nombre: 1 }));
};

// Carta pública: solo productos visibles y sin datos internos
const dbGetPublicProducts = async () => {
    return await ProductModel.find(ONLY_ACTIVE)
        .select('nombre description price precioCombo calificacion imagen state category isActive')
        .populate('category', 'name')
        .sort({ nombre: 1 });
};

const dbUpdateProduct = async (id, productUpdate) => {
    // La receta se edita como cualquier otro campo (PATCH /api/products/:id { receta: [...] })
    if (productUpdate.receta) await dbAssertRecipeSupplies(productUpdate.receta);

    return await ProductModel.findOneAndUpdate(
        { _id: id },
        productUpdate,
        { returnDocument: 'after', runValidators: true }
    );
};

const dbSetProductStatus = async (id, isActive) => {
    return await ProductModel.findOneAndUpdate({ _id: id }, { $set: { isActive } }, { returnDocument: 'after' });
};

const dbDeleteProduct = async (id) => {
    return await ProductModel.findOneAndDelete({ _id: id });
};

export {
    dbCreateProduct,
    dbGetProduct,
    dbGetProducts,
    dbGetPublicProducts,
    dbUpdateProduct,
    dbSetProductStatus,
    dbDeleteProduct
};
