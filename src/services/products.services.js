import mongoose from 'mongoose';

import { HttpError } from '../helpers/http-error.helper.js';
import { ONLY_ACTIVE } from '../helpers/visibility.helper.js';
import ProductModel from '../models/product.model.js';
import RecipeModel from '../models/recipe.model.js';

import { dbGetProductReviews } from './indicators.services.js';

// `createdBy` resuelve contra User: se limita la proyección para no exponer el hash de la contraseña.
const withRelations = (query) => query
    .populate('category', 'name type')
    .populate('createdBy', 'name email role')
    .populate('comboItems.product', 'name price');

/* ──────────────────────────────── Combos ──────────────────────────────── */

// Precio de un combo en modo 'sum': la suma de (precio actual × cantidad) de sus productos.
// `priceOf` es un Map _id → precio ya leído de la BD (así varios combos comparten una sola consulta).
const comboPriceFrom = (comboItems, priceOf) => {
    return comboItems.reduce((total, item) => total + (priceOf.get(String(item.product)) ?? 0) * item.quantity, 0);
};

// Lee los precios actuales de unos productos: Map _id → precio
const dbGetPrices = async (productIds) => {
    const products = await ProductModel.find({ _id: { $in: productIds } }).select('price').lean();

    return new Map(products.map((product) => [ String(product._id), product.price ?? 0 ]));
};

/**
 * Reglas de un combo ANTES de guardarlo. Devuelve los campos ya listos para guardar.
 *   - Las líneas repetidas del mismo producto se unen: [{A,1},{A,2}] → [{A,3}].
 *   - Cada producto existe y no es otro combo ni el propio combo (sin combos dentro de combos).
 *   - Un producto con receta no puede volverse combo: gastaría su receta y la de sus productos.
 *   - Modo 'sum' ("Sumar Precio Productos"): el precio es la suma de sus productos.
 * Con la lista vacía es un producto normal y no se toca nada.
 *
 * @param {{ comboItems?: Array, comboPriceMode?: string, price?: number }} data
 * @param {string} [ownId] - _id del producto cuando se está editando
 */
const prepareCombo = async ({ comboItems = [], comboPriceMode, price }, ownId) => {
    if (!Array.isArray(comboItems)) throw new HttpError(400, "'comboItems' debe ser una lista de { product, quantity }");
    if (!comboItems.length) return { comboItems: [], comboPriceMode, price };

    const errors = {};
    const quantities = new Map();

    comboItems.forEach((item, index) => {
        const productId = String(item?.product ?? '');
        const quantity = item?.quantity ?? 1;

        if (!mongoose.isObjectIdOrHexString(productId)) errors[`comboItems[${index}].product`] = 'Debe ser el _id de un producto';
        else if (ownId && productId === String(ownId)) errors[`comboItems[${index}].product`] = 'Un combo no puede incluirse a sí mismo';
        if (!Number.isInteger(quantity) || quantity < 1) errors[`comboItems[${index}].quantity`] = 'Debe ser un número entero mayor o igual a 1';

        if (!Object.keys(errors).length) quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    });

    if (Object.keys(errors).length) throw new HttpError(400, 'El combo tiene productos inválidos', errors);

    const items = [ ...quantities ].map(([ product, quantity ]) => ({ product, quantity }));

    // A la vez: los productos del combo (con su precio, para el modo 'sum') y si el propio producto
    // tiene receta. Los errores se revisan después en el mismo orden de siempre.
    const [ found, hasRecipe ] = await Promise.all([
        ProductModel.find({ _id: { $in: [ ...quantities.keys() ] } }).select('comboItems price').lean(),
        ownId ? RecipeModel.exists({ product: ownId }) : null
    ]);
    const foundById = new Map(found.map((product) => [ String(product._id), product ]));

    items.forEach(({ product }) => {
        const match = foundById.get(product);

        if (!match) errors[`comboItems.${product}`] = 'El producto no existe';
        else if (match.comboItems?.length) errors[`comboItems.${product}`] = 'Un combo no puede incluir otro combo';
    });

    if (Object.keys(errors).length) throw new HttpError(400, 'El combo tiene productos inválidos', errors);

    if (hasRecipe) {
        throw new HttpError(409, 'Este producto tiene receta: elimínala antes de convertirlo en combo');
    }

    // Los precios ya vienen en `found`: no hace falta otra consulta para sumarlos
    const priceOf = new Map(found.map((product) => [ String(product._id), product.price ?? 0 ]));

    return {
        comboItems: items,
        comboPriceMode,
        price: comboPriceMode === 'sum' ? comboPriceFrom(items, priceOf) : price
    };
};

/**
 * Cuando cambia el precio de un producto, los combos en modo 'sum' que lo incluyen se
 * recalculan: "Sumar Precio Productos" siempre refleja los precios actuales.
 * Los precios de TODOS esos combos se leen en una sola consulta y los combos se guardan a la vez
 * (cada save() toca un documento distinto, con sus validaciones y su updatedAt como siempre).
 */
const dbRefreshComboPrices = async (productId) => {
    const combos = await ProductModel.find({ comboPriceMode: 'sum', 'comboItems.product': productId });

    if (!combos.length) return;

    const productIds = [ ...new Set(combos.flatMap((combo) => combo.comboItems.map((item) => String(item.product)))) ];
    const priceOf = await dbGetPrices(productIds);

    await Promise.all(combos.map((combo) => {
        combo.price = comboPriceFrom(combo.comboItems, priceOf);

        return combo.save();
    }));
};

/* ──────────────────────────────── CRUD ──────────────────────────────── */

const dbCreateProduct = async (newProduct) => {
    return await ProductModel.create({ ...newProduct, ...await prepareCombo(newProduct) });
};

const dbGetProduct = async (id) => {
    return await withRelations(ProductModel.findOne({ _id: id }));
};

// Gestión: todos los productos o filtrados por visibilidad (ver buildVisibilityFilter)
const dbGetProducts = async (filter = {}) => {
    return await withRelations(ProductModel.find(filter).sort({ name: 1 }));
};

/**
 * Carta pública: solo productos visibles y sin datos internos. Cada uno trae `rating`:
 * { score: promedio de estrellas 1-5, count: cuántas valoraciones }. Sale de los comentarios
 * visibles hechos con el QR de una compra que incluía ese producto (el mismo cálculo de las
 * reseñas de Indicadores). Sin valoraciones: { score: 0, count: 0 }.
 */
const dbGetPublicProducts = async () => {
    const [ products, reviews ] = await Promise.all([
        ProductModel.find(ONLY_ACTIVE)
            .select('name description price stock images category status comboItems comboPriceMode')
            .populate('category', 'name')
            .populate('comboItems.product', 'name price')
            .sort({ name: 1 })
            .lean(),
        dbGetProductReviews()
    ]);
    const ratingOf = new Map(reviews.map(({ name, score, count }) => [ name, { score, count } ]));

    return products.map((product) => ({ ...product, rating: ratingOf.get(product.name) ?? { score: 0, count: 0 } }));
};

/**
 * Se edita con save() (no con findOneAndUpdate) para aplicar las reglas del combo con los datos
 * completos: si solo llega el modo 'sum', se usan los productos que el combo ya tenía.
 */
const dbUpdateProduct = async (id, productUpdate) => {
    const product = await ProductModel.findById(id);

    if (!product) return null;

    const combo = await prepareCombo({
        comboItems: productUpdate.comboItems ?? product.comboItems.map((item) => item.toObject()),
        comboPriceMode: productUpdate.comboPriceMode ?? product.comboPriceMode,
        price: productUpdate.price ?? product.price
    }, id);

    product.set({ ...productUpdate, ...combo });
    await product.save();

    await dbRefreshComboPrices(product._id);

    return product;
};

const dbSetProductStatus = async (id, status) => {
    return await ProductModel.findOneAndUpdate({ _id: id }, { $set: { status } }, { returnDocument: 'after' });
};

/**
 * Un producto que forma parte de un combo no se elimina (el combo quedaría incompleto): 409.
 * Al eliminarlo, su receta se va con él.
 */
const dbDeleteProduct = async (id) => {
    const combo = await ProductModel.findOne({ 'comboItems.product': id }).select('name').lean();

    if (combo) throw new HttpError(409, `No se puede eliminar: el producto está en el combo "${combo.name}"`);

    const product = await ProductModel.findOneAndDelete({ _id: id });

    if (product) await RecipeModel.deleteOne({ product: product._id });

    return product;
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
