import { HttpError } from '../helpers/http-error.helper.js';
import orderModel from '../models/order.model.js';
import saleModel from '../models/sale.model.js';

import { assertOrderOpen, dbBuildDetails, dbFindOrderWithSale, mergeDetails, ORDER_STATES } from './order-details.services.js';
import { dbSyncOrderStatus } from './sales.services.js';

// 'Finalizado' solo lo pone POST /api/sales: así todo pedido finalizado tiene su venta
const assertNotManualFinish = (estado) => {
    if (estado === ORDER_STATES.FINISHED) {
        throw new HttpError(400, 'El estado "Finalizado" se asigna al registrar la venta (POST /api/sales)');
    }
};

/**
 * Crea el pedido con los precios del catálogo. orderNumber, subtotales y total los pone el modelo.
 * @param {{ items: {productId: string, quantity: number}[], estado?: string }} data
 */
const dbCreateOrder = async ({ items, estado }) => {
    assertNotManualFinish(estado);

    return await orderModel.create({ estado, detalles: await dbBuildDetails(items) });
};

// Listado con filtro opcional por estado (?estado=Listo), del más reciente al más antiguo
const dbReadOrders = async ({ estado } = {}) => {
    return await orderModel.find(estado ? { estado } : {}).sort({ createdAt: -1 });
};

const dbReadOrderById = async (id) => {
    return await orderModel.findById(id);
};

/**
 * Añade productos a un pedido abierto (ver mergeDetails). El hook del modelo recalcula
 * subtotales y total; optimisticConcurrency convierte un choque entre cajas en 409.
 */
const dbAddOrderItems = async (id, items) => {
    const { order, hasSale } = await dbFindOrderWithSale(id);

    if (!order) return null;

    await assertOrderOpen(order, hasSale);

    mergeDetails(order, await dbBuildDetails(items));
    await order.save();

    return order;
};

/**
 * Reemplaza los productos de un pedido ABIERTO por la lista completa que llega (PUT /:id/items):
 * así se quitan productos y se bajan o suben cantidades. Reglas:
 *   - Un producto que ya estaba conserva el precio con el que se pidió; uno nuevo entra con el
 *     precio actual del catálogo.
 *   - Las líneas antiguas sin productId (pedidos de antes) no se pueden nombrar y se conservan.
 *   - La lista no puede quedar vacía (parseItems lo rechaza): para vaciar un pedido, se cancela.
 * Pedido cerrado o con venta → 409 (assertOrderOpen).
 */
const dbReplaceOrderItems = async (id, items) => {
    const { order, hasSale } = await dbFindOrderWithSale(id);

    if (!order) return null;

    await assertOrderOpen(order, hasSale);

    const wanted = new Map(items.map(({ productId, quantity }) => [ productId, quantity ]));
    const legacy = order.detalles.filter((detalle) => !detalle.productId);
    const kept = order.detalles.filter((detalle) => detalle.productId && wanted.has(String(detalle.productId)));

    kept.forEach((detalle) => {
        detalle.cantidad = wanted.get(String(detalle.productId));
        wanted.delete(String(detalle.productId));
    });

    const added = await dbBuildDetails([ ...wanted ].map(([ productId, quantity ]) => ({ productId, quantity })));

    order.detalles = [ ...legacy, ...kept, ...added ];
    await order.save();

    return order;
};

// Solo cambia el estado; los productos se cambian con dbAddOrderItems / dbReplaceOrderItems.
// Se usa save() y no findOneAndUpdate: así corren los hooks y el control de concurrencia.
// Un pedido ya vendido solo puede pasar a 'Cancelado' (anula su venta en los indicadores).
const dbUpdateOrder = async (id, { estado }) => {
    assertNotManualFinish(estado);

    const { order, hasSale } = await dbFindOrderWithSale(id);

    if (!order) return null;

    const sold = order.estado === ORDER_STATES.FINISHED || (hasSale ?? await saleModel.exists({ orderId: order._id }));
    if (sold && estado !== undefined && estado !== ORDER_STATES.CANCELLED && estado !== order.estado) {
        throw new HttpError(409, 'El pedido ya tiene una venta registrada: solo puede pasar a "Cancelado"');
    }

    if (estado !== undefined) order.estado = estado;
    await order.save();

    // Si el pedido ya se vendió, su venta (y los indicadores) siguen el nuevo estado
    if (estado !== undefined) await dbSyncOrderStatus(order);

    return order;
};

// Un pedido ya vendido no se elimina: su venta quedaría apuntando a un pedido inexistente.
const dbDeleteOrder = async (id) => {
    const { order, hasSale } = await dbFindOrderWithSale(id);

    if (!order) return null;

    if (hasSale ?? await saleModel.exists({ orderId: order._id })) {
        throw new HttpError(409, 'No se puede eliminar un pedido que ya tiene una venta registrada');
    }

    await order.deleteOne();

    return order;
};

export {
    dbCreateOrder,
    dbReadOrders,
    dbReadOrderById,
    dbAddOrderItems,
    dbReplaceOrderItems,
    dbUpdateOrder,
    dbDeleteOrder
};
