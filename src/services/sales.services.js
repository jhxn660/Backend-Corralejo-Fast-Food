import saleModel from "../models/sale.model.js";
import orderModel from "../models/order.model.js";
import { dbConsolidateDays } from "./indicators.services.js";
import { dbDiscountStock, dbRestoreStock } from "./supplies.services.js";
import { HttpError } from "../helpers/http-error.helper.js";
import { addDays, parseBusinessDate, toDayKey } from "../helpers/business-date.helper.js";
import { assertOrderOpen, dbBuildDetails, mergeDetails, ORDER_STATES, SELLABLE_STATES } from "./order-details.services.js";

/**
 * Flujo de una venta:  [Pedido ─▶] Venta ─▶ Indicadores
 * La venta nace de un pedido (que pasa a 'Finalizado') o es directa en caja. Una vez guardada,
 * su día de negocio se reconsolida en indicadores. Lo mismo ocurre al editarla o eliminarla.
 */

/**
 * Reconsolida los días de negocio afectados por un cambio en ventas.
 * Si falla NO se revierte ni se rechaza la operación: la venta ya es un hecho y la
 * consolidación es idempotente, así que el día se corrige en la siguiente venta o con
 * POST /api/indicators/rebuild. Se devuelve el resultado para informarlo en la respuesta.
 */
const syncIndicators = async (...dates) => {
    try {
        await dbConsolidateDays(dates.filter(Boolean).map((date) => toDayKey(date)));

        return true;
    } catch (error) {
        console.error('No se pudieron actualizar los indicadores:', error);

        return false;
    }
};

/**
 * Registra la venta de un pedido: valida, añade los items extra (si llegan) y crea la venta con sus líneas.
 *
 * Sin transacciones, la exclusión entre dos cajas que venden el mismo pedido la da el paso 3:
 * un findOneAndUpdate condicional es atómico, así que solo una petición encuentra el pedido en
 * un estado que admite venta y lo pasa a 'Finalizado'. La otra recibe 409.
 * Si crear la venta falla después, el pedido vuelve a su estado anterior (compensación).
 */
const sellOrder = async (orderId, items, saleFields) => {
    // 1. Validaciones con mensajes claros
    const order = await orderModel.findById(orderId);

    if (!order) throw new HttpError(404, 'El pedido asociado no existe');

    const existingSale = await saleModel.findOne({ orderId: order._id });
    if (existingSale) {
        throw new HttpError(409, 'El pedido ya tiene una venta registrada', { data: existingSale });
    }

    if (!SELLABLE_STATES.includes(order.estado)) {
        throw new HttpError(409, `No se puede registrar la venta de un pedido "${order.estado}"`);
    }

    // Los pedidos abiertos pueden estar vacíos; venderlos no.
    if (!items && order.detalles.length === 0) {
        throw new HttpError(400, 'El pedido está vacío: agrega productos antes de registrar la venta');
    }

    // 2. Productos de último momento: entran al pedido con las mismas reglas que /orders/:id/items
    if (items) {
        await assertOrderOpen(order);
        mergeDetails(order, await dbBuildDetails(items));
        await order.save();
    }

    // 3. Reclamo atómico. $inc de __v: un "añadir productos" leído antes de este punto fallará con 409
    const previousState = order.estado;
    const finished = await orderModel.findOneAndUpdate(
        { _id: order._id, estado: { $in: SELLABLE_STATES } },
        { $set: { estado: ORDER_STATES.FINISHED }, $inc: { __v: 1 } },
        { returnDocument: 'after' }
    );

    if (!finished) throw new HttpError(409, 'El pedido cambió mientras se registraba la venta. Vuelve a cargarlo e inténtalo de nuevo');

    // 4. Inventario: se descuenta lo que gastan las líneas. Si no alcanza, lanza 400 y el
    //    catch de abajo devuelve el pedido a su estado anterior.
    // 5. La venta copia las líneas del pedido ya reclamado (incluye cualquier cambio previo al reclamo)
    let consumoInsumos = [];
    try {
        consumoInsumos = await dbDiscountStock(finished.detalles);

        return await saleModel.create({
            ...saleFields,
            orderId: finished._id,
            estadoPedido: ORDER_STATES.FINISHED,
            detalles: finished.detalles.map((detalle) => detalle.toObject()),
            consumoInsumos
        });
    } catch (error) {
        // Si la venta no se pudo crear, el stock descontado vuelve al inventario
        await dbRestoreStock(consumoInsumos);
        await orderModel.updateOne(
            { _id: finished._id, estado: ORDER_STATES.FINISHED },
            { $set: { estado: previousState }, $inc: { __v: 1 } }
        );
        throw error;
    }
};

/**
 * Venta directa (sin pedido): arma las líneas desde el catálogo, descuenta el inventario y crea
 * la venta. Si la venta falla, el stock descontado se devuelve.
 */
const sellDirect = async (items, saleFields) => {
    const detalles = await dbBuildDetails(items);
    const consumoInsumos = await dbDiscountStock(detalles);

    try {
        return await saleModel.create({ ...saleFields, detalles, consumoInsumos });
    } catch (error) {
        await dbRestoreStock(consumoInsumos);
        throw error;
    }
};

/**
 * Registra una venta y la consolida en indicadores.
 *   - Con `orderId`: vende el pedido (sellOrder). `items` es opcional: se añaden al pedido antes.
 *   - Sin `orderId`: venta directa; `items` es obligatorio (lo exige el controlador).
 * En ambos casos las líneas salen del catálogo o del pedido, nunca del body, y totalPagado,
 * saleId, ticketId y qr los calcula el modelo.
 *
 * @param {{ orderId?: string, items?: {productId: string, quantity: number}[], fields: Object }} data
 * @param {Object} employee - Usuario autenticado que registra la venta
 */
const dbRegisterSale = async ({ orderId, items, fields }, employee) => {
    const saleFields = { ...fields, empleadoResponsable: employee?.name };

    const created = orderId
        ? await sellOrder(orderId, items, saleFields)
        : await sellDirect(items, saleFields);

    // Se devuelve con el pedido resuelto, igual que GET /api/sales/:id
    const sale = await created.populate('orderId');

    return { sale, indicatorsUpdated: await syncIndicators(sale.fecha) };
};

// Con el pedido resuelto en `orderId` (null en una venta directa)
const dbReadSaleById = async (id) => {
    return await saleModel.findById(id).populate('orderId');
};

/**
 * Listado con rango opcional de días de negocio (?from=YYYY-MM-DD&to=YYYY-MM-DD, ambos incluidos).
 * Resuelve `orderId` para devolver el pedido completo y evitarle al cliente una segunda consulta.
 */
const dbReadSales = async ({ from, to } = {}) => {
    const fecha = {
        ...(from && { $gte: parseBusinessDate(from) }),
        ...(to && { $lt: parseBusinessDate(addDays(to, 1)) })
    };

    return await saleModel
        .find(from || to ? { fecha } : {})
        .sort({ fecha: -1 })
        .populate('orderId');
};

// Búsqueda por el código del QR del ticket. La usa el módulo de comentarios para
// comprobar que el código escaneado corresponde a una venta real.
const dbReadSaleByQr = async (qr) => {
    return await saleModel.findOne({ qr });
};

// Datos de registro de una venta ya registrada. Líneas, total y estado no se editan (ver controlador);
// saleId, ticketId, qr y orderId además son `immutable` en el modelo.
const dbUpdateSale = async (id, changes) => {
    const sale = await saleModel.findById(id);

    if (!sale) return null;

    const previousDate = sale.fecha;

    // Solo llegan fecha, cliente y direccionEntrega (el controlador filtra el body)
    sale.set(changes);
    await sale.save();

    // Cambiar la fecha mueve la venta de día: se reconsolidan el anterior y el nuevo
    return { sale, indicatorsUpdated: await syncIndicators(previousDate, sale.fecha) };
};

// El estado de la venta copia el de su pedido: si el pedido cambia (p. ej. se cancela),
// la venta se actualiza y el día se reconsolida (una venta cancelada no cuenta como ingreso).
const dbSyncOrderStatus = async (order) => {
    const sale = await saleModel.findOneAndUpdate(
        { orderId: order._id, estadoPedido: { $ne: order.estado } },
        { $set: { estadoPedido: order.estado } },
        { returnDocument: 'after' }
    );

    if (sale) await syncIndicators(sale.fecha);

    return sale;
};

/**
 * Elimina la venta y la descuenta de los indicadores. Su saleId/ticketId no se reutilizan.
 * Si venía de un pedido 'Finalizado', el pedido vuelve a 'Listo': sin esto quedaría finalizado
 * sin venta y ya no se podría corregir ni volver a vender. Un pedido 'Cancelado' se deja igual.
 */
const dbDeleteSale = async (id) => {
    const sale = await saleModel.findOneAndDelete({ _id: id });

    if (!sale) return null;

    // Lo que esta venta gastó del inventario vuelve al stock
    await dbRestoreStock(sale.consumoInsumos);

    if (sale.orderId) {
        await orderModel.updateOne(
            { _id: sale.orderId, estado: ORDER_STATES.FINISHED },
            { $set: { estado: 'Listo' }, $inc: { __v: 1 } }
        );
    }

    return { sale, indicatorsUpdated: await syncIndicators(sale.fecha) };
};

export {
    dbRegisterSale,
    dbReadSaleById,
    dbReadSales,
    dbReadSaleByQr,
    dbUpdateSale,
    dbSyncOrderStatus,
    dbDeleteSale
};
