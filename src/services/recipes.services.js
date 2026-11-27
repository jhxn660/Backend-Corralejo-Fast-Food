import mongoose from 'mongoose';

import { HttpError } from '../helpers/http-error.helper.js';
import ProductModel from '../models/product.model.js';
import RecipeModel from '../models/recipe.model.js';
import SupplyModel from '../models/supply.model.js';

/* ──────────────────────────────── CRUD de recetas ──────────────────────────────── */

// Lo que se muestra de cada receta: el producto y, de cada insumo, su nombre, medida y stock
const RELATIONS = [
    { path: 'product', select: 'name price' },
    { path: 'items.supply', select: 'name medida stock' }
];

// Sirve igual para una consulta (find…) que para un documento ya guardado: los dos tienen populate()
const withRelations = (queryOrDocument) => queryOrDocument.populate(RELATIONS);

/**
 * Comprueba que la receta apunte a datos reales ANTES de guardarla:
 *   - el producto existe y NO es un combo (un combo gasta las recetas de sus productos);
 *   - cada insumo existe.
 * Lanza 400 con el detalle de lo que falla.
 */
const assertRecipeReferences = async ({ product, items = [] }) => {
    const errors = {};
    const supplyIds = items.map((item) => item?.supply).filter((id) => mongoose.isObjectIdOrHexString(id));

    // Producto e insumos no dependen uno del otro: se consultan a la vez (una sola espera a la BD)
    const [ found, existingSupplies ] = await Promise.all([
        product !== undefined && mongoose.isObjectIdOrHexString(product)
            ? ProductModel.findById(product).select('comboItems').lean()
            : null,
        SupplyModel.find({ _id: { $in: supplyIds } }).select('_id').lean()
    ]);

    if (product !== undefined) {
        if (!found) errors.product = 'El producto no existe';
        else if (found.comboItems?.length) errors.product = 'Un combo no lleva receta: usa las recetas de los productos que agrupa';
    }

    const existing = new Set(existingSupplies.map(({ _id }) => String(_id)));

    items.forEach((item, index) => {
        if (!existing.has(String(item?.supply))) errors[`items[${index}].supply`] = 'El insumo no existe';
    });

    if (Object.keys(errors).length) throw new HttpError(400, 'La receta tiene datos que no existen', errors);
};

const dbCreateRecipe = async ({ product, items, createdBy }) => {
    await assertRecipeReferences({ product, items });

    const recipe = await RecipeModel.create({ product, items, createdBy });

    // Se resuelven las relaciones del documento recién creado: no hace falta volver a buscarlo
    return await withRelations(recipe);
};

const dbGetRecipes = async () => {
    return await withRelations(RecipeModel.find().sort({ createdAt: -1 }));
};

const dbGetRecipe = async (id) => {
    return await withRelations(RecipeModel.findOne({ _id: id }));
};

// Solo cambian los insumos: el producto de una receta es fijo (immutable en el modelo)
const dbUpdateRecipe = async (id, { items }) => {
    const recipe = await RecipeModel.findById(id);

    if (!recipe) return null;

    await assertRecipeReferences({ items });

    recipe.items = items;
    await recipe.save();

    // El documento guardado ya está al día: solo falta resolver sus relaciones
    return await withRelations(recipe);
};

const dbDeleteRecipe = async (id) => {
    return await RecipeModel.findOneAndDelete({ _id: id });
};

/* ─────────────────────── Inventario: lo que gasta una venta ─────────────────────── */

// Redondeo a 4 decimales: 0.1 + 0.2 da 0.30000000000000004 en JavaScript
const round = (value) => Math.round(value * 1e4) / 1e4;

/**
 * Cuánto de cada insumo gastan unas líneas de venta o de pedido.
 *   1. Unidades vendidas de cada producto (las líneas antiguas sin productId no tienen receta).
 *   2. Un combo se cambia por los productos que agrupa (cantidad × unidades del combo).
 *   3. Receta × unidades, sumando por insumo: dos productos que usan pan lo suman junto.
 * Los insumos que ya no existen se ignoran: no se puede descontar lo que no está.
 *
 * @param {{ productId?: string, cantidad: number }[]} detalles
 * @returns {Promise<Map<string, number>>} _id del insumo → cantidad a descontar
 */
const dbGetUsageAndSupplies = async (detalles) => {
    const units = new Map();
    const addUnits = (productId, quantity) => units.set(String(productId), (units.get(String(productId)) ?? 0) + quantity);

    detalles.filter((detalle) => detalle.productId).forEach((detalle) => addUnits(detalle.productId, detalle.cantidad));

    const combos = await ProductModel
        .find({ _id: { $in: [ ...units.keys() ] }, 'comboItems.0': { $exists: true } })
        .select('comboItems')
        .lean();

    for (const combo of combos) {
        const comboUnits = units.get(String(combo._id));

        units.delete(String(combo._id));
        combo.comboItems.forEach(({ product, quantity }) => addUnits(product, quantity * comboUnits));
    }

    const recipes = await RecipeModel.find({ product: { $in: [ ...units.keys() ] } }).lean();
    const usage = new Map();

    for (const recipe of recipes) {
        const productUnits = units.get(String(recipe.product));

        recipe.items.forEach(({ supply, quantity }) => {
            usage.set(String(supply), round((usage.get(String(supply)) ?? 0) + quantity * productUnits));
        });
    }

    // Sin recetas no hay insumos que buscar: se ahorra la consulta
    if (!usage.size) return { usage, supplies: [] };

    // En la misma consulta que comprueba que existen se traen nombre, medida y stock:
    // así dbAssertSuppliesAvailable no necesita una segunda ida a la BD para los faltantes
    const supplies = await SupplyModel.find({ _id: { $in: [ ...usage.keys() ] } }).select('name medida stock').lean();
    const existingIds = new Set(supplies.map(({ _id }) => String(_id)));

    return { usage: new Map([ ...usage ].filter(([ supplyId ]) => existingIds.has(supplyId))), supplies };
};

// Solo el consumo (Map insumo → cantidad), para quien no necesita los datos de los insumos
const dbGetSuppliesUsage = async (detalles) => (await dbGetUsageAndSupplies(detalles)).usage;

/**
 * Compara el consumo con el stock de unos insumos ya leídos. Lista vacía = alcanza todo.
 * @returns {{ supply: string, name: string, medida: string, needed: number, available: number }[]}
 */
const findMissingSupplies = (usage, supplies) => {
    return supplies
        .map((supply) => ({
            supply: String(supply._id),
            name: supply.name,
            medida: supply.medida ?? '',
            needed: usage.get(String(supply._id)),
            available: round(supply.stock ?? 0)
        }))
        .filter(({ needed, available }) => needed > available);
};

// Los faltantes leyendo el stock actual de la BD (lo usa el descuento cuando otra venta ganó el stock)
const dbGetMissingSupplies = async (usage) => {
    const supplies = await SupplyModel.find({ _id: { $in: [ ...usage.keys() ] } }).select('name medida stock').lean();

    return findMissingSupplies(usage, supplies);
};

const notEnoughSupplies = (missing) => new HttpError(409, 'No alcanzan los insumos del inventario para esta venta', { missingSupplies: missing });

/**
 * Comprueba ANTES de vender que el inventario alcanza para unas líneas (409 con los faltantes).
 * Es la respuesta normal cuando falta un insumo; el descuento atómico de dbDiscountSupplies
 * cubre el caso raro de dos ventas al mismo tiempo.
 *
 * @returns {Promise<Map<string, number>>} el consumo calculado, para no recalcularlo al descontar
 */
const dbAssertSuppliesAvailable = async (detalles) => {
    const { usage, supplies } = await dbGetUsageAndSupplies(detalles);
    const missing = findMissingSupplies(usage, supplies);

    if (missing.length) throw notEnoughSupplies(missing);

    return usage;
};

// Suma (o resta, con signo negativo) una cantidad al stock de un insumo. Se redondea dentro de la
// BD (actualización con pipeline, por eso `updatePipeline`) para no acumular decimales sueltos.
const changeStock = (supplyId, amount, filter = {}) => SupplyModel.updateOne(
    { _id: supplyId, ...filter },
    [ { $set: { stock: { $round: [ { $add: [ '$stock', amount ] }, 4 ] } } } ],
    { updatePipeline: true }
);

/**
 * Descuenta un consumo del inventario. Cada resta es atómica y solo ocurre si hay stock
 * suficiente (filtro `stock >= cantidad`): el inventario nunca queda negativo.
 * Las restas se lanzan TODAS A LA VEZ (Promise.all): cada una toca un insumo distinto, así que
 * no se pisan, y se espera a la BD una sola vez en lugar de una vez por insumo.
 * Si algún insumo no alcanzó, se devuelve lo que sí se restó y se lanza 409: todo o nada.
 *
 * @returns {Promise<{ supply: string, quantity: number }[]>} lo descontado (se guarda en la venta)
 */
const dbDiscountSupplies = async (usage) => {
    const lines = [ ...usage ].map(([ supply, quantity ]) => ({ supply, quantity }));

    const results = await Promise.all(
        lines.map(({ supply, quantity }) => changeStock(supply, -quantity, { stock: { $gte: quantity } }))
    );

    const discounted = lines.filter((line, index) => results[index].modifiedCount);

    if (discounted.length < lines.length) {
        await dbReturnSupplies(discounted);
        throw notEnoughSupplies(await dbGetMissingSupplies(usage));
    }

    return discounted;
};

// Devuelve al inventario lo que una venta había descontado (venta eliminada o pedido cancelado).
// Igual que al descontar, las sumas van todas a la vez: cada una es atómica sobre su insumo.
const dbReturnSupplies = async (used = []) => {
    await Promise.all(used.map(({ supply, quantity }) => changeStock(supply, quantity)));
};

export {
    dbCreateRecipe,
    dbGetRecipes,
    dbGetRecipe,
    dbUpdateRecipe,
    dbDeleteRecipe,
    dbGetSuppliesUsage,
    dbAssertSuppliesAvailable,
    dbDiscountSupplies,
    dbReturnSupplies
};
