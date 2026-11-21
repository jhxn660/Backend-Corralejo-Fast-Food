import SupplyModel from '../models/supply.model.js';
import ProductModel from '../models/product.model.js';
import { HttpError } from '../helpers/http-error.helper.js';

// Crear un insumo y devolver su categoria y quien lo creo
const dbCreateSupply = async (newSupply) => {
    const supply = await SupplyModel.create(newSupply);

    return await supply.populate([
        { path: 'category', select: 'name' },
        { path: 'createdBy', select: 'name email role' }
    ]);
};

// Obtener un insumo por su ID
const dbGetSupply = async (id) => {
    return await SupplyModel
        .findOne({ _id: id })
        .populate('category', 'name')
        .populate('createdBy', 'name email role');
};

// Listar insumos con filtro opcional por estado de stock
const dbGetSupplies = async (state) => {
    let filter = {};

    const availableStates = ['Con_Stock', 'Sin_Stock'];

    // Filtrar por estado (solo si se envia y es un estado valido)
    if (state && availableStates.includes(state)) {
        filter.state = state;
    }

    return await SupplyModel
        .find(filter)
        .populate('category', 'name')
        .populate('createdBy', 'name email role');
};

// Actualizar un insumo por su ID
const dbUpdateSupply = async (id, supplyUpdated) => {
    return await SupplyModel.findOneAndUpdate(
        { _id: id },
        supplyUpdated,
        {
            returnDocument: 'after',           // Devuelve el documento ya actualizado
            runValidators: true  // Aplica las reglas del modelo tambien al actualizar
        }
    );
};

// Eliminar un insumo por su ID
const dbDeleteSupply = async (id) => {
    return await SupplyModel.findOneAndDelete({ _id: id });
};

/* ───────────────────────── INVENTARIO ─────────────────────────
 * El inventario NO es un módulo aparte: es el stock de los insumos. Cada producto tiene una
 * RECETA (qué insumos gasta una unidad) y con ella:
 *   - dbGetAvailability: cuántas unidades de cada producto se pueden preparar ahora.
 *   - dbDiscountStock:   al registrar una venta, resta del stock lo que gastó.
 *   - dbRestoreStock:    al eliminar esa venta, devuelve exactamente lo que se restó.
 * ───────────────────────────────────────────────────────────── */

// Las cantidades de receta llevan decimales (0.3 kg). Se redondea a 4 decimales para que
// 0.1 + 0.2 no acabe en 0.30000000000000004 dentro del stock.
const round = (value) => Math.round((Number(value) || 0) * 10000) / 10000;

/**
 * Cuánto gasta de cada insumo un conjunto de líneas de pedido/venta.
 * @param {{ productId, cantidad }[]} detalles - Líneas con el producto y las unidades vendidas
 * @returns {Promise<Map<string, number>>} idInsumo → cantidad total
 */
const calculateConsumption = async (detalles) => {
    const productIds = detalles.map((detalle) => detalle.productId).filter(Boolean);
    const products = await ProductModel.find({ _id: { $in: productIds } }).select('receta').lean();
    const recipeOf = new Map(products.map((product) => [ String(product._id), product.receta ?? [] ]));

    const total = new Map();
    for (const detalle of detalles) {
        // Un combo gasta la misma receta que el plato solo (el acompañamiento no se controla)
        for (const linea of recipeOf.get(String(detalle.productId)) ?? []) {
            const supplyId = String(linea.supply);
            total.set(supplyId, round((total.get(supplyId) ?? 0) + linea.cantidad * detalle.cantidad));
        }
    }

    return total;
};

// El estado del insumo acompaña al stock: en 0 pasa a 'Sin_Stock' y, con stock, a 'Con_Stock'.
const syncSupplyStates = async (supplyIds) => {
    await SupplyModel.updateMany({ _id: { $in: supplyIds }, stock: { $lte: 0 } }, { $set: { state: 'Sin_Stock' } });
    await SupplyModel.updateMany({ _id: { $in: supplyIds }, stock: { $gt: 0 } }, { $set: { state: 'Con_Stock' } });
};

/** Devuelve al stock lo que se descontó (lo guardado en la venta como `consumoInsumos`). */
const dbRestoreStock = async (consumo = []) => {
    for (const { supply, cantidad } of consumo) {
        await SupplyModel.updateOne({ _id: supply }, { $inc: { stock: cantidad } });
    }

    await syncSupplyStates(consumo.map(({ supply }) => supply));
};

/**
 * Descuenta del stock lo que gastan las líneas vendidas.
 * - Primero comprueba que TODO alcance; si falta algo responde 400 con la lista `faltantes`
 *   (qué insumo, cuánto se necesita y cuánto hay) y no toca nada.
 * - Cada resta es condicional (`stock >= cantidad`): si otra caja vendió en el mismo instante y
 *   ya no alcanza, se deshacen las restas hechas y se responde 409. Así el stock nunca queda
 *   negativo aunque dos ventas lleguen a la vez.
 *
 * @returns {Promise<{ supply: string, cantidad: number }[]>} Lo descontado (se guarda en la venta)
 */
const dbDiscountStock = async (detalles) => {
    const consumption = await calculateConsumption(detalles);
    if (consumption.size === 0) return [];

    const supplies = await SupplyModel.find({ _id: { $in: [ ...consumption.keys() ] } }).select('name medida stock').lean();
    const supplyById = new Map(supplies.map((supply) => [ String(supply._id), supply ]));

    const faltantes = [ ...consumption ]
        .map(([ supplyId, requerido ]) => {
            const supply = supplyById.get(supplyId);
            const disponible = round(supply?.stock);

            return { insumo_id: supplyId, nombre: supply?.name ?? 'Insumo eliminado', unidad: supply?.medida ?? '', requerido, disponible };
        })
        .filter(({ requerido, disponible }) => requerido > disponible);

    if (faltantes.length) {
        const detalle = faltantes.map((f) => `${f.nombre}: se necesitan ${f.requerido} y hay ${f.disponible}`).join('; ');
        throw new HttpError(400, `No alcanza el inventario. ${detalle}.`, { faltantes });
    }

    const discounted = [];
    for (const [ supplyId, cantidad ] of consumption) {
        const result = await SupplyModel.updateOne(
            { _id: supplyId, stock: { $gte: cantidad } },
            { $inc: { stock: -cantidad } }
        );

        if (result.modifiedCount === 0) {
            await dbRestoreStock(discounted);
            throw new HttpError(409, 'El inventario cambió mientras se registraba la venta. Inténtalo de nuevo');
        }

        discounted.push({ supply: supplyId, cantidad });
    }

    await syncSupplyStates([ ...consumption.keys() ]);

    return discounted;
};

/**
 * Unidades que se pueden preparar AHORA de cada producto activo.
 * La forma de la respuesta es la que usa la pantalla de Pedidos:
 *   productos: [{ id, nombre, receta, controlado, disponibles, agotado, limitante }]
 *   insumos:   { [id]: { nombre, unidad, stockActual } }  (solo los que aparecen en recetas)
 * `disponibles: null` = el producto no tiene receta y el inventario no lo limita.
 */
const dbGetAvailability = async () => {
    const [ products, supplies ] = await Promise.all([
        ProductModel.find({ isActive: { $ne: false } }).select('nombre receta').lean(),
        SupplyModel.find().select('name medida stock').lean()
    ]);
    const supplyById = new Map(supplies.map((supply) => [ String(supply._id), supply ]));
    const usedSupplies = new Set();

    const productos = products.map((product) => {
        const receta = (product.receta ?? []).map((linea) => ({ insumo_id: String(linea.supply), cantidad_requerida: linea.cantidad }));
        if (receta.length === 0) {
            return { id: String(product._id), nombre: product.nombre, receta, controlado: false, disponibles: null, agotado: false, limitante: null };
        }

        // El insumo que se acaba primero pone el techo: floor(stock / cantidad por unidad)
        let limitante = null;
        for (const { insumo_id, cantidad_requerida } of receta) {
            usedSupplies.add(insumo_id);
            const supply = supplyById.get(insumo_id);
            const alcanza = Math.floor((supply?.stock ?? 0) / cantidad_requerida + 1e-9);
            if (!limitante || alcanza < limitante.alcanza) {
                limitante = { insumo_id, nombre: supply?.name ?? 'Insumo eliminado', alcanza };
            }
        }

        const disponibles = Math.max(0, limitante.alcanza);
        return { id: String(product._id), nombre: product.nombre, receta, controlado: true, disponibles, agotado: disponibles === 0, limitante };
    });

    const insumos = Object.fromEntries([ ...usedSupplies ].map((id) => {
        const supply = supplyById.get(id);
        return [ id, { nombre: supply?.name ?? null, unidad: supply?.medida ?? '', stockActual: round(supply?.stock) } ];
    }));

    return { generado: new Date().toISOString(), productos, insumos };
};

/** 400 si alguna línea de una receta apunta a un insumo que no existe. */
const dbAssertRecipeSupplies = async (receta = []) => {
    const ids = [ ...new Set(receta.map((linea) => String(linea?.supply ?? ''))) ];
    const found = await SupplyModel.countDocuments({ _id: { $in: ids } });

    if (found !== ids.length) throw new HttpError(400, 'La receta incluye insumos que no existen en el inventario');
};

export {
    dbGetAvailability,
    dbDiscountStock,
    dbRestoreStock,
    dbAssertRecipeSupplies,
    dbCreateSupply,
    dbGetSupply,
    dbGetSupplies,
    dbUpdateSupply,
    dbDeleteSupply
};
