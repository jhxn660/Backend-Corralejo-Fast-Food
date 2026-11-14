import ProductModel from "../models/product.model.js";
import saleModel from "../models/sale.model.js";
import { ONLY_ACTIVE } from "../helpers/visibility.helper.js";
import { HttpError } from "../helpers/http-error.helper.js";

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
 * Un producto inexistente u oculto (isActive: false) → 400.
 *
 * @param {{ productId: string, quantity: number }[]} items
 */
const dbBuildDetails = async (items) => {
    const products = await ProductModel
        .find({ _id: { $in: items.map((item) => item.productId) }, ...ONLY_ACTIVE })
        .select('nombre price')
        .lean();
    const byId = new Map(products.map((product) => [ String(product._id), product ]));

    const missing = items.filter(({ productId }) => !byId.has(productId));
    if (missing.length) {
        throw new HttpError(400, 'Hay productos que no existen o no están disponibles',
            Object.fromEntries(missing.map(({ productId }) => [ `items.${productId}`, 'Producto inexistente u oculto' ])));
    }

    return items.map(({ productId, quantity }) => {
        const { nombre, price } = byId.get(productId);

        return { productId, producto: nombre, cantidad: quantity, precio_unitario: price };
    });
};

// 409 si el pedido ya no admite productos (cerrado o con venta)
const assertOrderOpen = async (order) => {
    if (!OPEN_STATES.includes(order.estado)) {
        throw new HttpError(409, `El pedido está "${order.estado}" y ya no admite productos`);
    }

    if (await saleModel.exists({ orderId: order._id })) {
        throw new HttpError(409, 'El pedido ya tiene una venta registrada y no admite productos');
    }
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
    assertOrderOpen,
    mergeDetails
};
