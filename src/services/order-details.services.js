import mongoose from 'mongoose';

import { HttpError } from '../helpers/http-error.helper.js';
import { ONLY_ACTIVE } from '../helpers/visibility.helper.js';
import orderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import saleModel from '../models/sale.model.js';

/**
 * Ciclo de un pedido:
 *   En preparación ⇄ Listo ─▶ Entregado ─▶ Finalizado (al registrar su venta) ─▶ Cancelado
 *                     └──────────────┴─────────────┴────────────────────────────────▶ Cancelado
 * Lo comparten pedidos y ventas (archivo aparte para que orders y sales no se importen entre sí).
 */
const ORDER_STATES = Object.freeze({
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado'
});

// Admiten productos nuevos
const OPEN_STATES = Object.freeze([ 'En preparación', 'Listo' ]);
// Admiten el registro de su venta (un pedido entregado se puede vender después)
const SELLABLE_STATES = Object.freeze([ ...OPEN_STATES, 'Entregado' ]);

/**
 * Convierte items ya validados (parseItems) en líneas de detalle con el nombre y el precio
 * ACTUALES del catálogo. El precio se copia en la línea: si el catálogo cambia después, el
 * pedido conserva el precio con el que se pidió. subtotal y total los calcula el hook del modelo.
 * Un producto inexistente u oculto (status: false) → 400.
 *
 * @param {{ productId: string, quantity: number }[]} items
 */
const dbBuildDetails = async (items) => {
    const products = await ProductModel
        .find({ _id: { $in: items.map((item) => item.productId) }, ...ONLY_ACTIVE })
        .select('name price')
        .lean();
    const byId = new Map(products.map((product) => [ String(product._id), product ]));

    const missing = items.filter(({ productId }) => !byId.has(productId));
    if (missing.length) {
        throw new HttpError(400, 'Hay productos que no existen o no están disponibles',
            Object.fromEntries(missing.map(({ productId }) => [ `items.${productId}`, 'Producto inexistente u oculto' ])));
    }

    return items.map(({ productId, quantity }) => {
        const { name, price } = byId.get(productId);

        return { productId, producto: name, cantidad: quantity, precio_unitario: price };
    });
};

/**
 * 409 si el pedido ya no admite productos (cerrado o con venta).
 * @param {boolean} [hasSale] - Si quien llama ya sabe si el pedido tiene venta (dbFindOrderWithSale),
 *        se usa ese dato; si no lo pasa, se consulta aquí.
 */
const assertOrderOpen = async (order, hasSale) => {
    if (!OPEN_STATES.includes(order.estado)) {
        throw new HttpError(409, `El pedido está "${order.estado}" y ya no admite productos`);
    }

    if (hasSale ?? await saleModel.exists({ orderId: order._id })) {
        throw new HttpError(409, 'El pedido ya tiene una venta registrada y no admite productos');
    }
};

/**
 * Lee un pedido y, A LA VEZ, si ya tiene venta: dos consultas en paralelo = una sola espera a la BD.
 * Con un id de formato inválido no se adelanta nada: findById falla con el mismo error de siempre
 * y `hasSale` queda undefined (quien lo necesite lo consulta después, como antes).
 *
 * @returns {Promise<{ order: Object|null, hasSale: boolean|undefined }>}
 */
const dbFindOrderWithSale = async (id) => {
    if (!mongoose.isObjectIdOrHexString(id)) return { order: await orderModel.findById(id), hasSale: undefined };

    const [ order, sale ] = await Promise.all([
        orderModel.findById(id),
        saleModel.exists({ orderId: id })
    ]);

    return { order, hasSale: Boolean(sale) };
};

/**
 * Añade líneas al pedido (en memoria; quien llama hace el save). Si el producto ya estaba se suma
 * la cantidad y se conserva el precio con el que se pidió; si es nuevo, entra con el precio actual.
 * Las líneas antiguas (sin productId) nunca se fusionan.
 */
const mergeDetails = (order, lines) => {
    for (const line of lines) {
        const existing = order.detalles.find((detalle) => detalle.productId && String(detalle.productId) === line.productId);

        if (existing) existing.cantidad += line.cantidad;
        else order.detalles.push(line);
    }
};

export {
    ORDER_STATES,
    OPEN_STATES,
    SELLABLE_STATES,
    dbBuildDetails,
    dbFindOrderWithSale,
    assertOrderOpen,
    mergeDetails
};
