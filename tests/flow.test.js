/**
 * Ciclo operativo completo, de principio a fin y en orden:
 *   1. Crear pedido        → orderNumber, subtotales y total los calcula el servidor
 *   2. Añadir productos    → recálculo sobre el mismo pedido
 *   3. Vender el pedido    → saleId, ticketId y qr automáticos; el mismo pedido no se vende dos veces
 *   4. Venta directa       → sin orderId; un pedido sin vender queda abierto sin afectar ventas ni indicadores
 *
 * Proceso y MongoDB en memoria propios (no toca Atlas). Ejecutar con: npm test
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET ??= 'test-secret';
process.env.BUSINESS_TIMEZONE = 'America/Bogota';

const { default: app } = await import('../src/app.js');
const { dbCreateUser } = await import('../src/services/users.services.js');
const { ROLES } = await import('../src/config/roles.config.js');
const { default: dailyIndicatorModel } = await import('../src/models/daily-indicator.model.js');

const PASSWORD = 'Clave#2026';
const DAY = '2026-11-20';
const CATALOG = { hamburguesa: [ 'Hamburguesa doble', 22000 ], papas: [ 'Papas a la francesa', 7000 ], limonada: [ 'Limonada natural', 5000 ] };

let mongo;
let server;
let baseUrl;
const tokens = {};
const product = {}; // clave → _id
const state = {};   // lo que cada paso deja al siguiente

const call = async (method, path, body, token = tokens.employee) => {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token && { 'X-Token': token }) },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();

    return { status: response.status, body: text ? JSON.parse(text) : null };
};

const expectStatus = ({ status, body }, expected) => {
    assert.equal(status, expected, JSON.stringify(body));

    return body;
};

// Cada item lleva además precio y subtotal falsos: el servidor debe ignorarlos
const items = (...lines) => lines.map(([ key, quantity ]) => ({ productId: product[key], quantity, precio_unitario: 1, subtotal: 1 }));
const lineOf = (doc, key) => doc.detalles.find((detalle) => detalle.productId === product[key]);
const price = (key) => CATALOG[key][1];

before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    for (const [ key, role ] of [ [ 'owner', ROLES.OWNER ], [ 'employee', ROLES.EMPLOYEE ] ]) {
        await dbCreateUser({ name: `${role} flujo`, email: `${key}@flujo.test`, password: PASSWORD, role });
        tokens[key] = expectStatus(await call('POST', '/api/auth/login', { email: `${key}@flujo.test`, password: PASSWORD }, null), 200).token;
    }

    const category = expectStatus(await call('POST', '/api/categories', { name: 'Menú', type: 'Producto' }, tokens.owner), 201).data._id;

    for (const [ key, [ nombre, priceValue ] ] of Object.entries(CATALOG)) {
        product[key] = expectStatus(await call('POST', '/api/products', { name: nombre, price: priceValue, category }, tokens.owner), 201).data._id;
    }
});

after(async () => {
    server?.close();
    await mongoose.disconnect();
    await mongo?.stop();
});

describe('Ciclo completo: pedido → añadir productos → venta', () => {
    test('Paso 1: crear el pedido calcula orderNumber, subtotales y total en el servidor', async () => {
        const order = expectStatus(await call('POST', '/api/orders', {
            items: items([ 'hamburguesa', 2 ], [ 'papas', 1 ]),
            totalPedido: 1,
            orderNumber: 999
        }), 201).data;

        assert.equal(order.orderNumber, 1);
        assert.equal(order.estado, 'En preparación');
        assert.equal(lineOf(order, 'hamburguesa').precio_unitario, price('hamburguesa'));
        assert.equal(lineOf(order, 'hamburguesa').subtotal, 2 * price('hamburguesa'));
        assert.equal(lineOf(order, 'papas').subtotal, price('papas'));
        assert.equal(order.totalPedido, 2 * price('hamburguesa') + price('papas'));

        state.order = order;
    });

    test('Paso 2: añadir productos al mismo pedido recalcula subtotales y total', async () => {
        const order = expectStatus(await call('POST', `/api/orders/${state.order._id}/items`, {
            items: items([ 'papas', 1 ], [ 'limonada', 2 ])
        }), 200).data;

        assert.equal(order.orderNumber, state.order.orderNumber);
        assert.equal(order.detalles.length, 3);
        assert.equal(lineOf(order, 'papas').cantidad, 2);
        assert.equal(lineOf(order, 'papas').subtotal, 2 * price('papas'));
        assert.equal(lineOf(order, 'limonada').subtotal, 2 * price('limonada'));
        assert.equal(order.totalPedido, 2 * price('hamburguesa') + 2 * price('papas') + 2 * price('limonada'));

        // El pedido guardado coincide con la respuesta
        assert.deepEqual(expectStatus(await call('GET', `/api/orders/${order._id}`), 200).data.detalles, order.detalles);
        state.order = order;
    });

    test('Paso 3: vender el pedido genera saleId, ticketId y qr, y bloquea una segunda venta', async () => {
        const body = expectStatus(await call('POST', '/api/sales', {
            orderId: state.order._id,
            fecha: `${DAY} 12:30`,
            saleId: 50, ticketId: 50, qr: 'QR-INVENTADO', totalPagado: 1
        }), 201);
        const sale = body.data;

        assert.equal(body.indicatorsUpdated, true);
        assert.equal(sale.saleId, 1);
        assert.equal(sale.ticketId, 1);
        assert.match(sale.qr, /^QR-[0-9A-F]{16}$/);
        assert.equal(sale.totalPagado, state.order.totalPedido);
        assert.equal(sale.detalles.length, state.order.detalles.length);
        assert.equal(sale.estadoPedido, 'Finalizado');
        assert.equal(sale.orderId._id, state.order._id);
        assert.equal(sale.orderId.estado, 'Finalizado');

        // Bloqueos: el mismo pedido no se vende dos veces ni admite más productos
        const again = expectStatus(await call('POST', '/api/sales', { orderId: state.order._id }), 409);
        assert.equal(again.data._id, sale._id);
        expectStatus(await call('POST', `/api/orders/${state.order._id}/items`, { items: items([ 'papas', 1 ]) }), 409);

        // El ticket habilita un comentario con su QR, una sola vez
        expectStatus(await call('POST', '/api/comments', { codigo: sale.qr, comentario: 'Todo muy rico', calificacion: 5 }, null), 201);
        expectStatus(await call('POST', '/api/comments', { codigo: sale.qr, comentario: 'Otra vez' }, null), 400);

        state.sale = sale;
    });

    test('Paso 4: venta directa sin orderId y un pedido sin vender que queda abierto sin afectar la integridad', async () => {
        // Pedido que se queda abierto (nunca se vende)
        const open = expectStatus(await call('POST', '/api/orders', { items: items([ 'limonada', 1 ]) }), 201).data;
        assert.equal(open.orderNumber, 2);

        const direct = expectStatus(await call('POST', '/api/sales', {
            items: items([ 'hamburguesa', 1 ], [ 'limonada', 1 ]),
            fecha: `${DAY} 18:00`
        }), 201).data;

        assert.equal(direct.orderId, undefined);
        assert.equal(direct.saleId, state.sale.saleId + 1);
        assert.equal(direct.ticketId, state.sale.ticketId + 1);
        assert.notEqual(direct.qr, state.sale.qr);
        assert.equal(direct.totalPagado, price('hamburguesa') + price('limonada'));

        // El pedido abierto sigue igual, sin venta, y todavía admite productos
        const stillOpen = expectStatus(await call('GET', `/api/orders/${open._id}`), 200).data;
        assert.equal(stillOpen.estado, 'En preparación');
        assert.equal(stillOpen.totalPedido, price('limonada'));
        expectStatus(await call('POST', `/api/orders/${open._id}/items`, { items: items([ 'papas', 1 ]) }), 200);

        // Solo cuentan las dos ventas: el pedido abierto no aparece en ventas ni en indicadores
        const sales = expectStatus(await call('GET', `/api/sales?from=${DAY}&to=${DAY}`), 200).data;
        assert.deepEqual(sales.map((sale) => sale.saleId).sort(), [ 1, 2 ]);
        assert.ok(sales.every((sale) => sale.orderId?._id !== open._id));

        const daily = await dailyIndicatorModel.findOne({ day: DAY }).lean();
        assert.equal(daily.salesCount, 2);
        assert.equal(daily.revenue, state.sale.totalPagado + direct.totalPagado);

        // Un pedido sin venta se puede cancelar o eliminar sin tocar las ventas
        expectStatus(await call('PATCH', `/api/orders/${open._id}`, { estado: 'Cancelado' }), 200);
        expectStatus(await call('DELETE', `/api/orders/${open._id}`, undefined, tokens.owner), 200);
        assert.equal((await dailyIndicatorModel.findOne({ day: DAY }).lean()).revenue, daily.revenue);

        // El pedido vendido no se puede eliminar: su venta quedaría huérfana
        expectStatus(await call('DELETE', `/api/orders/${state.order._id}`, undefined, tokens.owner), 409);
    });
});
