import { addDays, parseBusinessDate, toDayKey } from '../helpers/business-date.helper.js';
import { HttpError } from '../helpers/http-error.helper.js';
import orderModel from '../models/order.model.js';
import saleModel from '../models/sale.model.js';

import { dbConsolidateDays } from './indicators.services.js';
import { assertOrderOpen, dbBuildDetails, mergeDetails, ORDER_STATES, SELLABLE_STATES } from './order-details.services.js';
import { dbAssertSuppliesAvailable, dbDiscountSupplies, dbGetSuppliesUsage, dbReturnSupplies } from './recipes.services.js';

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
 * INVENTARIO: descuenta los insumos de las recetas de una venta recién creada y los anota en
 * `suppliesUsed`. Si no alcanzan (otra venta se llevó el stock entre la comprobación previa y
 * este punto), elimina la venta y lanza el 409: no queda una venta sin sus insumos descontados.
 *
 * @param {Map<string, number>} [usage] - Consumo ya calculado para estas mismas líneas (lo devuelve
 *        dbAssertSuppliesAvailable). Si no llega, se calcula aquí.
 */
const discountSaleSupplies = async (sale, usage) => {
    try {
        const used = await dbDiscountSupplies(usage ?? await dbGetSuppliesUsage(sale.detalles));

        if (used.length) {
            await saleModel.updateOne({ _id: sale._id }, { $set: { suppliesUsed: used } });
            sale.suppliesUsed = used;
        }

        return sale;
    } catch (error) {
        await saleModel.deleteOne({ _id: sale._id });
        throw error;
    }
};

/**
 * Devuelve al inventario, UNA sola vez, lo que descontó una venta (su pedido se canceló).
 * Vaciar `suppliesUsed` y leer lo que tenía es una sola operación: dos cancelaciones a la vez
 * no devuelven el doble.
 */
const returnSaleSupplies = async (saleId) => {
    const before = await saleModel.findOneAndUpdate(
        { _id: saleId, 'suppliesUsed.0': { $exists: true } },
        { $set: { suppliesUsed: [] } },
        { returnDocument: 'before' }
    );

    if (before) await dbReturnSupplies(before.suppliesUsed);
};

// ¿Dos listas de líneas piden lo mismo (mismos productos, mismas cantidades, mismo orden)?
const sameLines = (a, b) => a.length === b.length && a.every((line, index) => (
    String(line.productId) === String(b[index].productId) && line.cantidad === b[index].cantidad
));

/**
 * Registra la venta de un pedido: valida, añade los items extra (si llegan) y crea la venta con sus líneas.
 *
 * Sin transacciones, la exclusión entre dos cajas que venden el mismo pedido la da el paso 3:
 * un findOneAndUpdate condicional es atómico, así que solo una petición encuentra el pedido en
 * un estado que admite venta y lo pasa a 'Finalizado'. La otra recibe 409.
 * Si crear la venta falla después, el pedido vuelve a su estado anterior (compensación).
 */
const sellOrder = async (orderId, items, saleFields) => {
    // 1. Validaciones con mensajes claros. El pedido y su posible venta se leen a la vez
    //    (el controlador ya comprobó que orderId es un ObjectId válido)
    const [ order, existingSale ] = await Promise.all([
        orderModel.findById(orderId),
        saleModel.findOne({ orderId })
    ]);

    if (!order) throw new HttpError(404, 'El pedido asociado no existe');

    if (existingSale) {
        throw new HttpError(409, 'El pedido ya tiene una venta registrada', { data: existingSale });
    }

    if (!SELLABLE_STATES.includes(order.estado)) {
        throw new HttpError(409, `No se puede registrar la venta de un pedido "${order.estado}"`);
    }

    // 2. Productos de último momento: entran al pedido con las mismas reglas que /orders/:id/items
    if (items) {
        // Ya se sabe que no tiene venta (paso 1): no hace falta volver a preguntarlo
        await assertOrderOpen(order, false);
        mergeDetails(order, await dbBuildDetails(items));
        await order.save();
    }

    // 3. ¿Alcanzan los insumos de las recetas? Si no, 409 con la lista de faltantes y el pedido
    //    queda como estaba (todavía no se reclamó). Se guarda el consumo para reutilizarlo en el paso 5.
    const usage = await dbAssertSuppliesAvailable(order.detalles);

    // 4. Reclamo atómico. $inc de __v: un "añadir productos" leído antes de este punto fallará con 409
    const previousState = order.estado;
    const finished = await orderModel.findOneAndUpdate(
        { _id: order._id, estado: { $in: SELLABLE_STATES } },
        { $set: { estado: ORDER_STATES.FINISHED }, $inc: { __v: 1 } },
        { returnDocument: 'after' }
    );

    if (!finished) throw new HttpError(409, 'El pedido cambió mientras se registraba la venta. Vuelve a cargarlo e inténtalo de nuevo');

    // 5. La venta copia las líneas del pedido ya reclamado (incluye cualquier cambio previo al reclamo)
    //    y descuenta sus insumos. Si algo falla, el pedido vuelve a su estado anterior.
    try {
        const sale = await saleModel.create({
            ...saleFields,
            orderId: finished._id,
            estadoPedido: ORDER_STATES.FINISHED,
            detalles: finished.detalles.map((detalle) => detalle.toObject())
        });

        // Si las líneas no cambiaron desde el paso 3, el consumo ya calculado sirve; si cambiaron
        // (alguien añadió productos justo antes del reclamo), se recalcula con las líneas reales
        return await discountSaleSupplies(sale, sameLines(order.detalles, finished.detalles) ? usage : undefined);
    } catch (error) {
        await orderModel.updateOne(
            { _id: finished._id, estado: ORDER_STATES.FINISHED },
            { $set: { estado: previousState }, $inc: { __v: 1 } }
        );
        throw error;
    }
};

// Venta directa en caja (sin pedido): mismas reglas de inventario que la venta de un pedido
const sellDirect = async (items, saleFields) => {
    const detalles = await dbBuildDetails(items);

    const usage = await dbAssertSuppliesAvailable(detalles);

    // La venta lleva exactamente estas líneas: el consumo comprobado es el que se descuenta
    return await discountSaleSupplies(await saleModel.create({ ...saleFields, detalles }), usage);
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

    // Se devuelve con el pedido resuelto, igual que GET /api/sales/:id. Resolver el pedido y
    // consolidar los indicadores no dependen uno del otro: van a la vez
    const [ sale, indicatorsUpdated ] = await Promise.all([
        created.populate('orderId'),
        syncIndicators(created.fecha)
    ]);

    return { sale, indicatorsUpdated };
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

    if (!sale) return sale;

    // Reconsolidar el día y, si el pedido vendido se canceló, devolver al inventario los insumos
    // que gastó su venta. Son independientes: van a la vez
    await Promise.all([
        syncIndicators(sale.fecha),
        order.estado === ORDER_STATES.CANCELLED && returnSaleSupplies(sale._id)
    ]);

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

    // Tres pasos independientes, a la vez:
    //   - lo que la venta descontó vuelve al inventario (si su pedido se canceló, ya volvió y está vacío);
    //   - el pedido 'Finalizado' vuelve a 'Listo';
    //   - se reconsolida el día de la venta.
    const [ , , indicatorsUpdated ] = await Promise.all([
        dbReturnSupplies(sale.suppliesUsed),
        sale.orderId && orderModel.updateOne(
            { _id: sale.orderId, estado: ORDER_STATES.FINISHED },
            { $set: { estado: 'Listo' }, $inc: { __v: 1 } }
        ),
        syncIndicators(sale.fecha)
    ]);

    return { sale, indicatorsUpdated };
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
