import orderModel from "../models/order.model.js";
import saleModel, { generateQrCode } from "../models/sale.model.js";
import { raiseSequence } from "../models/counter.model.js";

/**
 * Migración de identificadores (pedidos y ventas creados antes de los consecutivos):
 *   pedidos: numeroPedido (lo enviaba el cliente)   → legacy.numeroPedido; orderNumber 1..N nuevo
 *   ventas:  idTicketVenta (contenido del QR)       → qr   (los tickets ya impresos siguen sirviendo)
 *            pedidoAsociado                         → orderId
 *            idVenta ('V-XXXX')                     → legacy.idVenta
 *            sin saleId / ticketId                  → 1..N por orden de creación
 * Es idempotente: solo toca documentos que aún no tienen los campos nuevos.
 * Trabaja sobre la colección cruda (sin hooks ni validaciones de Mongoose).
 */

// Los índices únicos antiguos deben irse ANTES de renombrar: al quitar el campo, todos los
// documentos pasarían a valer null en ese índice y el renombrado fallaría por duplicado.
const LEGACY_INDEXES = {
    [orderModel.collection.name]: ['numeroPedido_1'],
    [saleModel.collection.name]: ['idVenta_1', 'idTicketVenta_1', 'pedidoAsociado_1']
};

const dropIndexIfExists = async (collection, name) => {
    try {
        await collection.dropIndex(name);

        return true;
    } catch (error) {
        // 26 = la colección no existe, 27 = el índice no existe
        if (error.code === 26 || error.code === 27) return false;
        throw error;
    }
};

const renameIfMissing = async (collection, from, to) => {
    const { modifiedCount } = await collection.updateMany(
        { [from]: { $exists: true }, [to]: { $exists: false } },
        { $rename: { [from]: to } }
    );

    return modifiedCount;
};

// Numera en orden de creación (el _id lleva la fecha) los documentos sin número y deja el
// contador en el último asignado para que los nuevos sigan desde ahí.
const numberMissing = async (collection, fields, sequences) => {
    const [ last ] = await collection.find({ [fields[0]]: { $type: 'number' } })
        .sort({ [fields[0]]: -1 }).limit(1).project({ [fields[0]]: 1 }).toArray();
    let next = last?.[fields[0]] ?? 0;

    const pending = await collection.find({ [fields[0]]: { $exists: false } }).sort({ _id: 1 }).project({ _id: 1 }).toArray();
    const operations = pending.map(({ _id }) => {
        next += 1;

        return { updateOne: { filter: { _id }, update: { $set: Object.fromEntries(fields.map((field) => [field, next])) } } };
    });

    if (operations.length) await collection.bulkWrite(operations);
    for (const sequence of sequences) await raiseSequence(sequence, next);

    return operations.length;
};

const migrateSaleIdentifiers = async () => {
    const orders = orderModel.collection;
    const sales = saleModel.collection;
    const report = { droppedIndexes: [] };

    for (const collection of [orders, sales]) {
        for (const name of LEGACY_INDEXES[collection.collectionName]) {
            if (await dropIndexIfExists(collection, name)) report.droppedIndexes.push(`${collection.collectionName}.${name}`);
        }
    }

    report.ordersLegacyNumber = await renameIfMissing(orders, 'numeroPedido', 'legacy.numeroPedido');
    report.ordersNumbered = await numberMissing(orders, ['orderNumber'], ['orders']);

    report.salesQrFromTicket = await renameIfMissing(sales, 'idTicketVenta', 'qr');
    report.salesOrderId = await renameIfMissing(sales, 'pedidoAsociado', 'orderId');
    report.salesLegacyId = await renameIfMissing(sales, 'idVenta', 'legacy.idVenta');

    const withoutQr = await sales.find({ qr: { $exists: false } }).project({ _id: 1 }).toArray();
    if (withoutQr.length) {
        await sales.bulkWrite(withoutQr.map(({ _id }) => ({ updateOne: { filter: { _id }, update: { $set: { qr: generateQrCode() } } } })));
    }
    report.salesQrGenerated = withoutQr.length;

    // Las ventas antiguas reciben el mismo número de venta y de ticket
    report.salesNumbered = await numberMissing(sales, ['saleId', 'ticketId'], ['sales', 'tickets']);

    // Ahora que los datos cumplen los índices nuevos, se crean (autoIndex pudo fallar al arrancar)
    await orderModel.createIndexes();
    await saleModel.createIndexes();

    return report;
};

export { migrateSaleIdentifiers };
