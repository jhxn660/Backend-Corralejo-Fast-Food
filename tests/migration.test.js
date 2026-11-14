/**
 * Migración de identificadores sobre una base con el formato anterior (no toca Atlas).
 * Corre en su propio proceso y con su propio MongoDB en memoria.
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.BUSINESS_TIMEZONE = 'America/Bogota';

const { default: orderModel } = await import('../src/models/order.model.js');
const { default: saleModel } = await import('../src/models/sale.model.js');
const { default: counterModel } = await import('../src/models/counter.model.js');
const { migrateSaleIdentifiers } = await import('../src/migrations/sale-identifiers.migration.js');

const DETALLE = { producto: 'Gaseosa', cantidad: 1, precio_unitario: 4000, subtotal: 4000 };
const legacyOrderIds = [ new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId() ];
let mongo;

before(async () => {
    mongo = await MongoMemoryServer.create();
    // Como una base de Atlas antes de desplegar: índices y documentos con los campos antiguos
    await mongoose.connect(mongo.getUri(), { autoIndex: false });

    const orders = orderModel.collection;
    const sales = saleModel.collection;

    await orders.createIndex({ numeroPedido: 1 }, { unique: true });
    await sales.createIndex({ idVenta: 1 }, { unique: true });
    await sales.createIndex({ idTicketVenta: 1 }, { unique: true });
    await sales.createIndex({ pedidoAsociado: 1 }, { unique: true });

    await orders.insertMany(legacyOrderIds.map((_id, index) => ({
        _id, numeroPedido: 1731500000000 + index, estado: 'Entregado', totalPedido: 4000, detalles: [ DETALLE ]
    })));
    await sales.insertMany(legacyOrderIds.map((orderId, index) => ({
        idVenta: `V-OLD${index}`, idTicketVenta: `TCK-OLD${index}`, pedidoAsociado: orderId, fecha: new Date('2026-11-01T15:00:00Z'),
        cliente: 'Consumidor Final', totalPagado: 4000, empleadoResponsable: 'Histórico', estadoPedido: 'Entregado', detalles: [ DETALLE ]
    })));
});

after(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
});

test('migra pedidos y ventas antiguos a los consecutivos sin romper los QR impresos', async () => {
    const report = await migrateSaleIdentifiers();

    assert.deepEqual(report.droppedIndexes.sort(), [ 'pedidos.numeroPedido_1', 'ventas.idTicketVenta_1', 'ventas.idVenta_1', 'ventas.pedidoAsociado_1' ]);
    assert.equal(report.ordersNumbered, 2);
    assert.equal(report.salesNumbered, 2);

    const orders = await orderModel.find().sort({ _id: 1 }).lean();
    assert.deepEqual(orders.map((order) => order.orderNumber), [ 1, 2 ]);
    assert.equal(orders[0].legacy.numeroPedido, 1731500000000);

    const sales = await saleModel.find().sort({ _id: 1 }).lean();
    assert.deepEqual(sales.map((sale) => [ sale.saleId, sale.ticketId ]), [ [ 1, 1 ], [ 2, 2 ] ]);
    // El código del QR ya impreso se conserva: los comentarios de esos tickets siguen funcionando
    assert.equal(sales[0].qr, 'TCK-OLD0');
    assert.equal(String(sales[0].orderId), String(legacyOrderIds[0]));
    assert.equal(sales[0].legacy.idVenta, 'V-OLD0');
    assert.equal(sales[0].idTicketVenta, undefined);

    const counters = Object.fromEntries((await counterModel.find().lean()).map(({ _id, seq }) => [ _id, seq ]));
    assert.deepEqual(counters, { orders: 2, sales: 2, tickets: 2 });
});

test('después de migrar, lo nuevo continúa la secuencia y las ventas directas no chocan', async () => {
    const order = await orderModel.create({ detalles: [ DETALLE ] });
    assert.equal(order.orderNumber, 3);

    const sale = await saleModel.create({ orderId: order._id, empleadoResponsable: 'Caja', detalles: [ DETALLE ] });
    const directA = await saleModel.create({ empleadoResponsable: 'Caja', detalles: [ DETALLE ] });
    const directB = await saleModel.create({ empleadoResponsable: 'Caja', detalles: [ DETALLE ] });
    assert.deepEqual([ sale.saleId, directA.saleId, directB.saleId ], [ 3, 4, 5 ]);

    // El índice único parcial de orderId quedó creado: el mismo pedido no se vende dos veces
    await assert.rejects(saleModel.create({ orderId: order._id, empleadoResponsable: 'Caja', detalles: [ DETALLE ] }), { code: 11000 });
});

test('es idempotente', async () => {
    const report = await migrateSaleIdentifiers();

    assert.deepEqual(report.droppedIndexes, []);
    assert.equal(report.ordersNumbered + report.salesNumbered + report.salesQrFromTicket + report.salesOrderId, 0);
});
