/**
 * Pruebas de integración de toda la API contra un MongoDB en memoria (no toca Atlas).
 * Ejecutar con: npm test
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
const { default: saleModel } = await import('../src/models/sale.model.js');
const { default: dailyIndicatorModel } = await import('../src/models/daily-indicator.model.js');
const { default: counterModel } = await import('../src/models/counter.model.js');
const { default: productModel } = await import('../src/models/product.model.js');
const { default: orderModel } = await import('../src/models/order.model.js');

const PASSWORD = 'Clave#2026';
const DAY = '2026-11-13'; // día de referencia de los indicadores

let mongo;
let server;
let baseUrl;
const tokens = {};
const ids = {};

const request = async (method, path, { token, body, raw } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token && { 'X-Token': token }) },
        body: raw ?? (body === undefined ? undefined : JSON.stringify(body))
    });
    const text = await response.text();

    return { status: response.status, body: text ? JSON.parse(text) : null };
};

// Afirma el código HTTP y muestra el cuerpo si no coincide
const expectStatus = (response, status) => {
    assert.equal(response.status, status, JSON.stringify(response.body));

    return response.body;
};

const login = async (email) => expectStatus(await request('POST', '/api/auth/login', { body: { email, password: PASSWORD } }), 200).token;

// Catálogo de pruebas: nombre → _id (se crea al empezar la suite de Pedidos)
const catalog = {};

// Las pruebas describen las líneas como { producto, precio_unitario, cantidad }; la API recibe
// items [{ productId, quantity }]. Precio y subtotal se envían de más, con valores falsos,
// para comprobar que el servidor los ignora.
const toItems = (detalles) => detalles.map(({ producto, cantidad }) => ({ productId: catalog[producto], quantity: cantidad, precio_unitario: 1, subtotal: 1 }));

const createOrder = async (detalles, extra = {}) => {
    return expectStatus(await request('POST', '/api/orders', { token: tokens.employee, body: { items: toItems(detalles), ...extra } }), 201).data;
};

const addItems = (order, detalles, token = tokens.employee) => request('POST', `/api/orders/${order._id}/items`, { token, body: { items: toItems(detalles) } });

const sellOrder = async (order, fecha) => {
    return expectStatus(await request('POST', '/api/sales', {
        token: tokens.employee,
        body: { orderId: order._id, fecha }
    }), 201);
};

const HAMBURGUESA = { producto: 'Hamburguesa de res', precio_unitario: 18000 };
const PERRO = { producto: 'Perro Ranchero', precio_unitario: 12000 };
const GASEOSA = { producto: 'Gaseosa', precio_unitario: 4000 };

const dashboard = async () => expectStatus(await request('GET', `/api/indicators/dashboard?date=${DAY}`, { token: tokens.admin }), 200).data;
const kpi = (data, id) => data.kpis.find((item) => item.id === id);

before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    for (const [ key, role ] of [ [ 'owner', ROLES.OWNER ], [ 'admin', ROLES.ADMIN ], [ 'employee', ROLES.EMPLOYEE ] ]) {
        const user = await dbCreateUser({ name: `${role} prueba`, email: `${key}@cff.test`, password: PASSWORD, role });
        ids[key] = String(user._id);
        tokens[key] = await login(`${key}@cff.test`);
    }
});

after(async () => {
    server?.close();
    await mongoose.disconnect();
    await mongo?.stop();
});

describe('Infraestructura', () => {
    test('GET /health', async () => {
        expectStatus(await request('GET', '/health'), 200);
    });

    test('ruta inexistente → 404 JSON', async () => {
        assert.match(expectStatus(await request('GET', '/api/no-existe'), 404).msg, /Ruta no encontrada/);
    });

    test('JSON mal formado → 400', async () => {
        expectStatus(await request('POST', '/api/auth/login', { raw: '{"email":' }), 400);
    });

    test('ObjectId inválido → 400', async () => {
        expectStatus(await request('GET', '/api/products/123', { token: tokens.admin }), 400);
    });

    test('Authorization: Bearer también se acepta', async () => {
        const response = await fetch(`${baseUrl}/api/categories`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        assert.equal(response.status, 200);
    });
});

describe('Auth y Usuarios', () => {
    test('registro público crea un Cliente aunque pida otro rol', async () => {
        const body = expectStatus(await request('POST', '/api/auth/register', {
            body: { name: 'Cliente Prueba', email: 'cliente@cff.test', password: PASSWORD, role: ROLES.ADMIN }
        }), 201);

        assert.equal(body.data.role, ROLES.CLIENT);
        assert.equal(body.data.password, undefined);
        ids.client = body.data._id;
        tokens.client = await login('cliente@cff.test');
    });

    test('login: credenciales inválidas → 401, faltantes → 400', async () => {
        expectStatus(await request('POST', '/api/auth/login', { body: { email: 'admin@cff.test', password: 'mala' } }), 401);
        expectStatus(await request('POST', '/api/auth/login', { body: { email: 'admin@cff.test' } }), 400);
    });

    test('login: correo inexistente da el mismo 401 y no admite operadores de Mongo', async () => {
        assert.equal(expectStatus(await request('POST', '/api/auth/login', { body: { email: 'nadie@cff.test', password: PASSWORD } }), 401).msg, 'Credenciales inválidas');
        expectStatus(await request('POST', '/api/auth/login', { body: { email: { $ne: null }, password: PASSWORD } }), 400);
        expectStatus(await request('POST', '/api/auth/login', { body: { email: ' ADMIN@cff.test ', password: PASSWORD } }), 200);
    });

    test('solo un Owner gestiona cuentas Owner', async () => {
        const body = { name: 'Otro Owner', email: 'owner2@cff.test', password: PASSWORD, role: ROLES.OWNER };

        expectStatus(await request('POST', '/api/users', { token: tokens.admin, body }), 403);
        expectStatus(await request('PATCH', `/api/users/${ids.owner}`, { token: tokens.admin, body: { name: 'x' } }), 403);
        expectStatus(await request('PATCH', `/api/users/${ids.employee}`, { token: tokens.admin, body: { role: ROLES.OWNER } }), 403);
        expectStatus(await request('DELETE', `/api/users/${ids.owner}`, { token: tokens.admin }), 403);

        const created = expectStatus(await request('POST', '/api/users', { token: tokens.owner, body }), 201).data;
        expectStatus(await request('DELETE', `/api/users/${created._id}`, { token: tokens.owner }), 200);
    });

    test('renovar token', async () => {
        assert.ok(expectStatus(await request('GET', '/api/auth/renew-token', { token: tokens.admin }), 200).token);
        expectStatus(await request('GET', '/api/auth/renew-token'), 401);
    });

    test('CRUD de usuarios (administración)', async () => {
        const created = expectStatus(await request('POST', '/api/users', {
            token: tokens.admin, body: { name: 'Temporal', email: 'temporal@cff.test', password: PASSWORD, role: ROLES.EMPLOYEE }
        }), 201).data;

        assert.ok(expectStatus(await request('GET', '/api/users?state=all', { token: tokens.owner }), 200).data.total >= 5);
        expectStatus(await request('GET', `/api/users/${created._id}`, { token: tokens.admin }), 200);
        assert.equal(expectStatus(await request('PATCH', `/api/users/${created._id}`, { token: tokens.admin, body: { name: 'Editado' } }), 200).data.name, 'Editado');
        expectStatus(await request('PUT', `/api/users/${created._id}`, { token: tokens.admin, body: { name: 'Editado PUT' } }), 200);
        expectStatus(await request('DELETE', `/api/users/${created._id}`, { token: tokens.admin }), 200);
        expectStatus(await request('GET', `/api/users/${created._id}`, { token: tokens.admin }), 404);
    });

    test('un Cliente no lista usuarios y solo ve su propia cuenta', async () => {
        expectStatus(await request('GET', '/api/users', { token: tokens.client }), 403);
        expectStatus(await request('GET', `/api/users/${ids.admin}`, { token: tokens.client }), 403);
        expectStatus(await request('GET', `/api/users/${ids.client}`, { token: tokens.client }), 200);
    });

    test('un Empleado no puede elevarse el rol ni editar a otros', async () => {
        const self = expectStatus(await request('PATCH', `/api/users/${ids.employee}`, {
            token: tokens.employee, body: { role: ROLES.ADMIN, name: 'Empleado Editado' }
        }), 200).data;

        assert.equal(self.role, ROLES.EMPLOYEE);
        assert.equal(self.name, 'Empleado Editado');
        expectStatus(await request('PATCH', `/api/users/${ids.admin}`, { token: tokens.employee, body: { name: 'x' } }), 403);
    });
});

describe('Categorías e Insumos', () => {
    test('CRUD de categorías y control de roles', async () => {
        expectStatus(await request('POST', '/api/categories', { body: { name: 'Sin token', type: 'Producto' } }), 401);
        expectStatus(await request('POST', '/api/categories', { token: tokens.employee, body: { name: 'Sin permiso', type: 'Producto' } }), 403);

        ids.productCategory = expectStatus(await request('POST', '/api/categories', { token: tokens.admin, body: { name: 'Hamburguesas', type: 'Producto' } }), 201).data._id;
        ids.supplyCategory = expectStatus(await request('POST', '/api/categories', { token: tokens.owner, body: { name: 'Carnes', type: 'Insumo' } }), 201).data._id;

        expectStatus(await request('POST', '/api/categories', { token: tokens.admin, body: { name: 'Hamburguesas', type: 'Producto' } }), 400);
        expectStatus(await request('GET', '/api/categories', { token: tokens.employee }), 200);
        expectStatus(await request('GET', `/api/categories/${ids.productCategory}`, { token: tokens.employee }), 200);
        expectStatus(await request('PATCH', `/api/categories/${ids.productCategory}`, { token: tokens.admin, body: { description: 'Artesanales' } }), 200);

        const temporal = expectStatus(await request('POST', '/api/categories', { token: tokens.admin, body: { name: 'Temporal', type: 'Producto' } }), 201).data;
        expectStatus(await request('DELETE', `/api/categories/${temporal._id}`, { token: tokens.admin }), 200);
        expectStatus(await request('DELETE', `/api/categories/${temporal._id}`, { token: tokens.admin }), 404);
    });

    test('CRUD de insumos', async () => {
        expectStatus(await request('POST', '/api/supplies', { token: tokens.admin, body: { name: 'Carne molida', category: ids.productCategory } }), 400);

        const supply = expectStatus(await request('POST', '/api/supplies', { token: tokens.admin, body: { name: 'Carne molida', category: ids.supplyCategory, stock: 10 } }), 201).data;

        expectStatus(await request('GET', '/api/supplies', { token: tokens.employee }), 200);
        expectStatus(await request('GET', `/api/supplies/${supply._id}`, { token: tokens.employee }), 200);
        // Editar no cambia el autor original del insumo
        const updated = expectStatus(await request('PATCH', `/api/supplies/${supply._id}`, { token: tokens.owner, body: { stock: 5, createdBy: ids.owner } }), 200).data;
        assert.equal(updated.stock, 5);
        assert.equal(String(updated.createdBy), ids.admin);
        assert.equal(expectStatus(await request('GET', '/api/supplies?state=Sin_Stock', { token: tokens.employee }), 200).data.length, 0);
        expectStatus(await request('DELETE', `/api/supplies/${supply._id}`, { token: tokens.admin }), 200);
    });
});

describe('Productos: visibilidad (isActive)', () => {
    test('nace visible y aparece en la carta pública', async () => {
        const product = expectStatus(await request('POST', '/api/products', {
            token: tokens.admin, body: { nombre: 'Hamburguesa de res', price: 18000, category: ids.productCategory }
        }), 201).data;

        ids.product = product._id;
        assert.equal(product.isActive, true);

        const publicList = expectStatus(await request('GET', '/api/products/public'), 200).data;
        assert.ok(publicList.some((item) => item._id === ids.product));
        assert.equal(publicList[0].createdBy, undefined);
    });

    test('PATCH /:id/status oculta el producto en la carta pública', async () => {
        const body = expectStatus(await request('PATCH', `/api/products/${ids.product}/status`, { token: tokens.admin, body: { isActive: false } }), 200);

        assert.equal(body.data.isActive, false);
        assert.equal(body.msg, 'Producto deshabilitado');
        assert.ok(!expectStatus(await request('GET', '/api/products/public'), 200).data.some((item) => item._id === ids.product));
    });

    test('filtros de gestión ?isActive=true|false|all', async () => {
        const hidden = expectStatus(await request('GET', '/api/products?isActive=false', { token: tokens.employee }), 200).data;
        const visible = expectStatus(await request('GET', '/api/products?isActive=true', { token: tokens.employee }), 200).data;
        const all = expectStatus(await request('GET', '/api/products', { token: tokens.employee }), 200).data;

        assert.equal(hidden.length, 1);
        assert.equal(visible.length, 0);
        assert.equal(all.length, 1);
        expectStatus(await request('GET', '/api/products?isActive=quizas', { token: tokens.employee }), 400);
    });

    test('validaciones del toggle y del PATCH general', async () => {
        expectStatus(await request('PATCH', `/api/products/${ids.product}/status`, { token: tokens.admin, body: { isActive: 'true' } }), 400);
        expectStatus(await request('PATCH', `/api/products/${ids.product}/status`, { token: tokens.admin, body: {} }), 400);
        expectStatus(await request('PATCH', `/api/products/${ids.product}/status`, { token: tokens.employee, body: { isActive: true } }), 403);
        expectStatus(await request('PATCH', '/api/products/64b7f0c2a1b2c3d4e5f60718/status', { token: tokens.admin, body: { isActive: true } }), 404);

        // El PATCH general ignora isActive: la visibilidad solo cambia por /status
        const updated = expectStatus(await request('PATCH', `/api/products/${ids.product}`, { token: tokens.admin, body: { price: 19000, isActive: true } }), 200).data;
        assert.equal(updated.price, 19000);
        assert.equal(updated.isActive, false);

        assert.equal(expectStatus(await request('PATCH', `/api/products/${ids.product}/status`, { token: tokens.admin, body: { isActive: true } }), 200).data.isActive, true);
    });

    test('obtener y eliminar producto', async () => {
        expectStatus(await request('GET', `/api/products/${ids.product}`, { token: tokens.employee }), 200);

        const temporal = expectStatus(await request('POST', '/api/products', {
            token: tokens.admin, body: { nombre: 'Producto temporal', category: ids.productCategory }
        }), 201).data;
        expectStatus(await request('DELETE', `/api/products/${temporal._id}`, { token: tokens.admin }), 200);
    });
});

describe('Pedidos', () => {
    before(async () => {
        // 'Hamburguesa de res' ya existe (suite de Productos, donde su precio quedó en 19000)
        await productModel.updateOne({ nombre: HAMBURGUESA.producto }, { price: HAMBURGUESA.precio_unitario });
        catalog[HAMBURGUESA.producto] = ids.product;

        for (const { producto, precio_unitario } of [ PERRO, GASEOSA ]) {
            catalog[producto] = expectStatus(await request('POST', '/api/products', {
                token: tokens.admin, body: { nombre: producto, price: precio_unitario, category: ids.productCategory }
            }), 201).data._id;
        }
    });

    test('el servidor numera el pedido y calcula subtotales y total desde el catálogo', async () => {
        const order = await createOrder([ { ...HAMBURGUESA, cantidad: 2, subtotal: 1 } ], { totalPedido: 5, orderNumber: 500 });

        assert.equal(order.totalPedido, 36000);
        assert.equal(order.detalles[0].subtotal, 36000);
        assert.equal(order.detalles[0].precio_unitario, 18000);
        assert.equal(order.detalles[0].producto, HAMBURGUESA.producto);
        assert.equal(order.detalles[0].productId, catalog[HAMBURGUESA.producto]);
        assert.equal(order.estado, 'En preparación');
        // Primer pedido de la base: la secuencia empieza en 1 e ignora el número del body
        assert.equal(order.orderNumber, 1);
        ids.orderA = order;
    });

    test('listar, obtener, actualizar y eliminar', async () => {
        const temporal = await createOrder([ { ...PERRO, cantidad: 1 } ]);
        assert.equal(temporal.orderNumber, ids.orderA.orderNumber + 1);

        assert.ok(expectStatus(await request('GET', '/api/orders', { token: tokens.employee }), 200).data.length >= 2);
        assert.equal(expectStatus(await request('GET', '/api/orders?estado=Listo', { token: tokens.employee }), 200).data.length, 0);
        expectStatus(await request('GET', `/api/orders/${temporal._id}`, { token: tokens.employee }), 200);

        const patched = expectStatus(await request('PATCH', `/api/orders/${temporal._id}`, {
            token: tokens.employee, body: { estado: 'Listo', orderNumber: 99, totalPedido: 1 }
        }), 200).data;
        assert.equal(patched.totalPedido, 12000);
        assert.equal(patched.estado, 'Listo');
        assert.equal(patched.orderNumber, temporal.orderNumber);

        // Los productos no se editan por PATCH: tienen su propia ruta
        expectStatus(await request('PATCH', `/api/orders/${temporal._id}`, { token: tokens.employee, body: { detalles: [] } }), 400);
        expectStatus(await request('PATCH', `/api/orders/${temporal._id}`, { token: tokens.employee, body: { items: [] } }), 400);

        expectStatus(await request('PUT', `/api/orders/${temporal._id}`, { token: tokens.employee, body: { estado: 'Inventado' } }), 400);
        expectStatus(await request('DELETE', `/api/orders/${temporal._id}`, { token: tokens.employee }), 403);
        expectStatus(await request('DELETE', `/api/orders/${temporal._id}`, { token: tokens.admin }), 200);
        expectStatus(await request('GET', `/api/orders/${temporal._id}`, { token: tokens.employee }), 404);
    });

    test('items inválidos se rechazan con el detalle de cada error', async () => {
        const create = (items) => request('POST', '/api/orders', { token: tokens.employee, body: { items } });

        expectStatus(await create([]), 400);
        expectStatus(await create(undefined), 400);
        // detalles con precios del cliente ya no crean pedidos
        expectStatus(await request('POST', '/api/orders', { token: tokens.employee, body: { detalles: [ { ...HAMBURGUESA, cantidad: 1 } ] } }), 400);

        const invalid = expectStatus(await create([
            { productId: 'abc', quantity: 1 },
            { productId: catalog[PERRO.producto], quantity: 0 },
            { productId: { $ne: null }, quantity: 1.5 }
        ]), 400);
        assert.deepEqual(Object.keys(invalid).sort(), [ 'items[0].productId', 'items[1].quantity', 'items[2].productId', 'items[2].quantity', 'msg' ]);

        const missing = '64b7f0c2a1b2c3d4e5f60718';
        assert.ok(`items.${missing}` in expectStatus(await create([ { productId: missing, quantity: 1 } ]), 400));
    });

    test('un producto oculto no se puede pedir', async () => {
        const status = (isActive) => request('PATCH', `/api/products/${catalog[GASEOSA.producto]}/status`, { token: tokens.admin, body: { isActive } });

        expectStatus(await status(false), 200);
        expectStatus(await request('POST', '/api/orders', { token: tokens.employee, body: { items: toItems([ { ...GASEOSA, cantidad: 1 } ]) } }), 400);
        expectStatus(await status(true), 200);
    });

    test('las líneas repetidas del mismo producto se unen', async () => {
        const order = await createOrder([ { ...PERRO, cantidad: 1 }, { ...PERRO, cantidad: 2 } ]);

        assert.equal(order.detalles.length, 1);
        assert.equal(order.detalles[0].cantidad, 3);
        assert.equal(order.totalPedido, 36000);
        expectStatus(await request('DELETE', `/api/orders/${order._id}`, { token: tokens.admin }), 200);
    });
});

// POST /api/orders/:id/items: fusión de líneas, precio congelado, pedido abierto y concurrencia
describe('Pedidos: añadir productos a un pedido existente', () => {
    test('suma a la línea existente o agrega una nueva, y recalcula el total', async () => {
        const order = await createOrder([ { ...HAMBURGUESA, cantidad: 1 } ]);
        const updated = expectStatus(await addItems(order, [ { ...PERRO, cantidad: 2 }, { ...HAMBURGUESA, cantidad: 1 } ]), 200).data;

        assert.equal(updated.orderNumber, order.orderNumber);
        assert.deepEqual(updated.detalles.map(({ producto, cantidad, subtotal }) => [ producto, cantidad, subtotal ]), [
            [ HAMBURGUESA.producto, 2, 36000 ],
            [ PERRO.producto, 2, 24000 ]
        ]);
        assert.equal(updated.totalPedido, 60000);
        ids.openOrder = updated;
    });

    test('una línea existente conserva su precio; una nueva toma el precio actual', async () => {
        await productModel.updateOne({ _id: catalog[PERRO.producto] }, { price: 15000 });
        await productModel.updateOne({ _id: catalog[GASEOSA.producto] }, { price: 5000 });

        const updated = expectStatus(await addItems(ids.openOrder, [ { ...PERRO, cantidad: 1 }, { ...GASEOSA, cantidad: 1 } ]), 200).data;
        const line = (name) => updated.detalles.find((detalle) => detalle.producto === name);

        assert.equal(line(PERRO.producto).precio_unitario, 12000);
        assert.equal(line(PERRO.producto).subtotal, 36000);
        assert.equal(line(GASEOSA.producto).precio_unitario, 5000);
        assert.equal(updated.totalPedido, 36000 + 36000 + 5000);

        await productModel.updateOne({ _id: catalog[PERRO.producto] }, { price: PERRO.precio_unitario });
        await productModel.updateOne({ _id: catalog[GASEOSA.producto] }, { price: GASEOSA.precio_unitario });
    });

    test('solo un pedido abierto admite productos', async () => {
        for (const estado of [ 'Entregado', 'Cancelado' ]) {
            const order = await createOrder([ { ...PERRO, cantidad: 1 } ], { estado });
            assert.match(expectStatus(await addItems(order, [ { ...PERRO, cantidad: 1 } ]), 409).msg, new RegExp(estado));
            expectStatus(await request('DELETE', `/api/orders/${order._id}`, { token: tokens.admin }), 200);
        }

        const ready = await createOrder([ { ...PERRO, cantidad: 1 } ], { estado: 'Listo' });
        expectStatus(await addItems(ready, [ { ...PERRO, cantidad: 1 } ]), 200);
        expectStatus(await request('DELETE', `/api/orders/${ready._id}`, { token: tokens.admin }), 200);
    });

    test('roles, pedido inexistente e items inválidos', async () => {
        expectStatus(await addItems(ids.openOrder, [ { ...PERRO, cantidad: 1 } ], tokens.client), 403);
        expectStatus(await addItems({ _id: '64b7f0c2a1b2c3d4e5f60718' }, [ { ...PERRO, cantidad: 1 } ]), 404);
        expectStatus(await request('POST', `/api/orders/${ids.openOrder._id}/items`, { token: tokens.employee, body: { items: [] } }), 400);
    });

    test('añadidos simultáneos: ninguno se pierde (los que chocan reciben 409)', async () => {
        const quantity = (order) => order.detalles.find((detalle) => detalle.producto === GASEOSA.producto).cantidad;
        const initial = expectStatus(await request('GET', `/api/orders/${ids.openOrder._id}`, { token: tokens.employee }), 200).data;

        const responses = await Promise.all(Array.from({ length: 5 }, () => addItems(ids.openOrder, [ { ...GASEOSA, cantidad: 1 } ])));
        const accepted = responses.filter(({ status }) => status === 200).length;

        assert.ok(responses.every(({ status }) => status === 200 || status === 409));
        assert.ok(accepted >= 1);

        const final = expectStatus(await request('GET', `/api/orders/${ids.openOrder._id}`, { token: tokens.employee }), 200).data;
        assert.equal(quantity(final), quantity(initial) + accepted);

        // Choque garantizado: dos copias leídas a la vez; la segunda en guardar es rechazada
        const [ first, second ] = await Promise.all([ orderModel.findById(ids.openOrder._id), orderModel.findById(ids.openOrder._id) ]);
        first.estado = 'Listo';
        await first.save();
        second.estado = 'En preparación';
        await assert.rejects(second.save(), { name: 'VersionError' });

        expectStatus(await request('DELETE', `/api/orders/${ids.openOrder._id}`, { token: tokens.admin }), 200);
    });
});

describe('Ventas ↔ Pedidos ↔ Indicadores', () => {
    test('la venta toma los datos del pedido y consolida indicadores', async () => {
        const body = await sellOrder(ids.orderA, '2026-11-12 13:00');

        assert.equal(body.indicatorsUpdated, true);
        assert.equal(body.data.totalPagado, 36000);
        assert.equal(body.data.empleadoResponsable, 'Empleado Editado');
        assert.equal(body.data.estadoPedido, 'Finalizado');
        // El pedido queda finalizado y la respuesta lo trae resuelto
        assert.equal(body.data.orderId.estado, 'Finalizado');
        assert.equal(body.data.detalles[0].productId, catalog[HAMBURGUESA.producto]);
        assert.equal(body.data.saleId, 1);
        assert.equal(body.data.ticketId, 1);
        assert.match(body.data.qr, /^QR-[0-9A-F]{16}$/);
        ids.saleA = body.data;

        const daily = await dailyIndicatorModel.findOne({ day: '2026-11-12' }).lean();
        assert.equal(daily.revenue, 36000);
        assert.equal(daily.itemsSold, 2);
        assert.equal(daily.salesCount, 1);
    });

    test('reglas de la venta: un pedido se vende una vez, debe existir y no estar cancelado', async () => {
        expectStatus(await request('POST', '/api/sales', { token: tokens.employee, body: { orderId: ids.orderA._id } }), 409);
        expectStatus(await request('POST', '/api/sales', { token: tokens.employee, body: { orderId: '64b7f0c2a1b2c3d4e5f60718' } }), 404);
        expectStatus(await request('POST', '/api/sales', { token: tokens.employee, body: {} }), 400);

        const cancelled = await createOrder([ { ...PERRO, cantidad: 1 } ], { estado: 'Cancelado' });
        expectStatus(await request('POST', '/api/sales', { token: tokens.employee, body: { orderId: cancelled._id } }), 409);

        expectStatus(await request('DELETE', `/api/orders/${ids.orderA._id}`, { token: tokens.admin }), 409);
        // Vendido: ya no admite productos
        assert.match(expectStatus(await addItems(ids.orderA, [ { ...PERRO, cantidad: 1 } ]), 409).msg, /Finalizado/);
    });

    test('la venta se agrupa por día de negocio en la hora local', async () => {
        // 20:30 en Bogotá ya es el 14 en UTC: debe contar el 13
        const order = await createOrder([ { ...PERRO, cantidad: 1 }, { ...GASEOSA, cantidad: 2 } ]);
        ids.saleB = (await sellOrder(order, '2026-11-13 20:30')).data;
        assert.equal(ids.saleB.saleId, ids.saleA.saleId + 1);
        assert.equal(ids.saleB.ticketId, ids.saleA.ticketId + 1);
        assert.notEqual(ids.saleB.qr, ids.saleA.qr);

        assert.equal(new Date(ids.saleB.fecha).toISOString(), '2026-11-14T01:30:00.000Z');
        assert.equal((await dailyIndicatorModel.findOne({ day: '2026-11-13' }).lean()).revenue, 20000);
        assert.equal(await dailyIndicatorModel.countDocuments({ day: '2026-11-14' }), 0);
    });

    test('ventas de otros períodos para las comparativas', async () => {
        await sellOrder(await createOrder([ { ...HAMBURGUESA, cantidad: 3 } ]), '2026-10-05 10:00');
        ids.saleLateOctober = (await sellOrder(await createOrder([ { ...HAMBURGUESA, cantidad: 1 } ]), '2026-10-20 10:00')).data;
        await sellOrder(await createOrder([ { ...PERRO, cantidad: 1 } ]), '2025-11-10 12:00');
    });

    test('listar ventas con rango de fechas y obtener por ID', async () => {
        assert.equal(expectStatus(await request('GET', '/api/sales', { token: tokens.employee }), 200).data.length, 5);

        const november = expectStatus(await request('GET', '/api/sales?from=2026-11-01&to=2026-11-13', { token: tokens.employee }), 200).data;
        assert.equal(november.length, 2);
        assert.equal(november[0].orderId.totalPedido, 20000);

        expectStatus(await request('GET', '/api/sales?from=13-11-2026', { token: tokens.employee }), 400);
        expectStatus(await request('GET', `/api/sales/${ids.saleA._id}`, { token: tokens.employee }), 200);
    });
});

describe('Indicadores: dashboard', () => {
    test('meta anual', async () => {
        expectStatus(await request('PUT', '/api/indicators/goal/2026', { token: tokens.admin, body: { target: '1000000' } }), 400);
        expectStatus(await request('PUT', '/api/indicators/goal/2026', { token: tokens.employee, body: { target: 1000000 } }), 403);
        expectStatus(await request('PUT', '/api/indicators/goal/2026', { token: tokens.admin, body: { target: 1000000 } }), 200);
    });

    test('KPIs comparan el período en curso contra el mismo tramo del anterior', async () => {
        const data = await dashboard();

        // Mes: 1–13 nov = 36.000 + 20.000 · mes anterior 1–13 oct = 54.000 (la venta del 20 oct no cuenta)
        assert.deepEqual(
            { value: kpi(data, 'k1').value, trend: kpi(data, 'k1').trend },
            { value: '$56.000', trend: '▲ 3.7% vs mes anterior' }
        );
        // Año 2026 = 128.000 · 2025 hasta el 13 nov = 12.000
        assert.equal(kpi(data, 'k2').value, '$128.000');
        assert.equal(kpi(data, 'k2').trend, '▲ 966.7% vs año anterior');
        assert.equal(kpi(data, 'k3').value, '5');
        assert.equal(kpi(data, 'k3').raw.previous, 3);
    });

    test('meta y comparación', async () => {
        const { goal, comparison } = await dashboard();

        assert.deepEqual(
            { value: goal.value, progressPercent: goal.progressPercent, remaining: goal.remaining },
            { value: '$1.000.000', progressPercent: 12.8, remaining: '$872.000' }
        );
        assert.equal(comparison.previous.year, '2025');
        assert.equal(comparison.previous.sales, '$12.000');
        assert.equal(comparison.current.sales, '$128.000');
        assert.equal(comparison.current.products, '9');
        assert.equal(comparison.yearlyDiff, '▲ 966.7%');
        assert.equal(comparison.yearlyNote, '$116.000 más que el año anterior');
        assert.deepEqual(comparison.monthly, { label: 'Noviembre 2026', value: '$56.000', diff: '▲ 366.7% vs nov. 2025' });
    });

    test('indicadores por producto y ranking', async () => {
        const { productRows, ranking } = await dashboard();

        assert.deepEqual(productRows.map((row) => row.name), [ 'Hamburguesa de res', 'Perro Ranchero', 'Gaseosa' ]);
        assert.deepEqual(
            { qty: productRows[0].monthly.qty, revenue: productRows[0].monthly.revenue, pct: productRows[0].monthly.pct },
            { qty: '2', revenue: '$36.000', pct: 64 }
        );
        assert.equal(productRows[0].annual.revenue, '$108.000');

        assert.deepEqual(ranking.map(({ pos, tone, name, pct }) => ({ pos, tone, name, pct })), [
            { pos: 1, tone: 'gold', name: 'Hamburguesa de res', pct: 67 },
            { pos: 2, tone: 'silver', name: 'Gaseosa', pct: 22 },
            { pos: 3, tone: 'bronze', name: 'Perro Ranchero', pct: 11 }
        ]);
    });

    test('rutas por widget conservan el contrato anterior', async () => {
        const kpis = expectStatus(await request('GET', `/api/indicators/kpis?date=${DAY}`, { token: tokens.admin }), 200);
        assert.ok(Array.isArray(kpis) && kpis.length === 3);

        for (const section of [ 'goal', 'comparison', 'productRows', 'ranking', 'reviews' ]) {
            expectStatus(await request('GET', `/api/indicators/${section}?date=${DAY}`, { token: tokens.admin }), 200);
        }

        expectStatus(await request('GET', '/api/indicators/kpis?date=2026-02-30', { token: tokens.admin }), 400);
        expectStatus(await request('GET', '/api/indicators/kpis', { token: tokens.employee }), 403);
        expectStatus(await request('GET', '/api/indicators/kpis', { token: tokens.owner }), 200);
    });

    test('sin meta para el año la vista recibe huecos, no ceros inventados', async () => {
        const { data } = expectStatus(await request('GET', '/api/indicators/dashboard?date=2025-11-13', { token: tokens.admin }), 200);

        assert.equal(data.goal.value, null);
        assert.equal(data.goal.progressPercent, 0);
        assert.equal(kpi(data, 'k2').trend, 'Sin datos: año anterior');
    });
});

describe('Indicadores: panel de la vista actual', () => {
    const panel = async (query) => expectStatus(await request('GET', `/api/indicators/panel?${query}`, { token: tokens.admin }), 200).data;

    test('mes analizado contra el mes anterior completo', async () => {
        const { month, summary } = await panel('month=2026-11');

        assert.deepEqual(month, { key: '2026-11', label: 'Noviembre 2026' });
        assert.deepEqual(summary.current, { revenue: 56000, salesCount: 2, itemsSold: 5, averageTicket: 28000 });
        // Octubre completo: 54.000 (día 5) + 18.000 (día 20)
        assert.equal(summary.previous.revenue, 72000);
        assert.equal(summary.previousMonth.key, '2026-10');
        assert.equal(summary.variation.revenue.percent, -22.2);
        assert.equal(summary.variation.revenue.trend, 'down');
    });

    test('meta, comparación de meses y de años', async () => {
        const { goal, monthComparison, yearComparison } = await panel('month=2026-11&compareA=2026-11&compareB=2025-11&yearA=2026&yearB=2025');

        assert.deepEqual(goal, { year: 2026, target: 1000000, achieved: 128000, progressPercent: 12.8, remaining: 872000, reached: false });
        assert.equal(monthComparison.a.totals.revenue, 56000);
        assert.equal(monthComparison.b.totals.revenue, 12000);
        assert.equal(monthComparison.variation.revenue.percent, 366.7);

        assert.equal(yearComparison.a.months.length, 12);
        assert.equal(yearComparison.a.months[9], 72000);
        assert.equal(yearComparison.a.months[10], 56000);
        assert.equal(yearComparison.b.total, 12000);
        assert.equal(yearComparison.variation.percent, 966.7);
    });

    test('ventas por día, productos, ranking y opciones de los selectores', async () => {
        const { daily, products, ranking, options } = await panel('month=2026-11');

        assert.equal(daily.length, 30);
        assert.deepEqual(daily[11], { day: 12, date: '2026-11-12', revenue: 36000, salesCount: 1 });
        assert.equal(daily[12].revenue, 20000);

        assert.equal(products[0].name, 'Hamburguesa de res');
        assert.deepEqual(products[0].month, { quantity: 2, revenue: 36000, share: 64.3 });
        assert.deepEqual(products[0].year, { quantity: 6, revenue: 108000, share: 84.4 });

        assert.deepEqual(ranking.map(({ name, share }) => ({ name, share })), [
            { name: 'Hamburguesa de res', share: 66.7 },
            { name: 'Gaseosa', share: 22.2 },
            { name: 'Perro Ranchero', share: 11.1 }
        ]);

        const monthKeys = options.months.map((option) => option.key);
        assert.ok([ '2026-11', '2026-10', '2025-11' ].every((key) => monthKeys.includes(key)));
        assert.ok(options.years.includes('2025') && options.years.includes('2026'));
    });

    test('valores por defecto y validaciones', async () => {
        expectStatus(await request('GET', '/api/indicators/panel', { token: tokens.admin }), 200);

        for (const query of [ 'month=2026-13', 'month=nov', 'compareB=2026-1', 'yearA=26' ]) {
            expectStatus(await request('GET', `/api/indicators/panel?${query}`, { token: tokens.admin }), 400);
        }

        expectStatus(await request('GET', '/api/indicators/panel', { token: tokens.employee }), 403);
    });
});

describe('Indicadores: métricas por rango', () => {
    test('comparación contra el año anterior con serie diaria continua', async () => {
        const { data } = expectStatus(await request('GET', '/api/indicators/metrics?from=2026-11-01&to=2026-11-13&compare=previous_year', { token: tokens.admin }), 200);

        assert.equal(data.totals.revenue, 56000);
        assert.equal(data.totals.averageTicket, 28000);
        assert.equal(data.comparison.totals.revenue, 12000);
        assert.equal(data.comparison.variation.revenue.percent, 366.7);
        assert.equal(data.series.points.length, 13);
        assert.equal(data.series.points.find((point) => point.period === '2026-11-12').revenue, 36000);
        assert.equal(data.topProducts[0].name, 'Hamburguesa de res');
    });

    test('período anterior de igual duración y agrupación mensual', async () => {
        const previous = expectStatus(await request('GET', '/api/indicators/metrics?from=2026-11-01&to=2026-11-13', { token: tokens.admin }), 200).data;
        assert.deepEqual(previous.comparison.range, { from: '2026-10-19', to: '2026-10-31', days: 13 });
        assert.equal(previous.comparison.totals.revenue, 18000);

        const monthly = expectStatus(await request('GET', '/api/indicators/metrics?from=2026-01-01&to=2026-11-13&groupBy=month&compare=none', { token: tokens.admin }), 200).data;
        assert.equal(monthly.comparison, null);
        assert.equal(monthly.series.points.length, 11);
        assert.equal(monthly.series.points.find((point) => point.period === '2026-10').revenue, 72000);
    });

    test('rango personalizado y validaciones', async () => {
        const custom = expectStatus(await request('GET', '/api/indicators/metrics?from=2026-11-01&to=2026-11-13&compare=custom&compareFrom=2026-10-01&compareTo=2026-10-31', { token: tokens.admin }), 200).data;
        assert.equal(custom.comparison.totals.revenue, 72000);

        for (const query of [
            'from=2026-11-13&to=2026-11-01',
            'compare=custom',
            'groupBy=week',
            'top=0',
            'from=2020-01-01&to=2026-11-13&groupBy=day'
        ]) {
            expectStatus(await request('GET', `/api/indicators/metrics?${query}`, { token: tokens.admin }), 400);
        }
    });
});

describe('Indicadores: editar y eliminar ventas', () => {
    test('mover una venta de fecha reconsolida ambos días', async () => {
        const body = expectStatus(await request('PATCH', `/api/sales/${ids.saleLateOctober._id}`, { token: tokens.admin, body: { fecha: '2026-11-05 10:00' } }), 200);

        assert.equal(body.indicatorsUpdated, true);
        assert.equal(await dailyIndicatorModel.countDocuments({ day: '2026-10-20' }), 0);
        assert.equal(kpi(await dashboard(), 'k1').value, '$74.000');
    });

    test('las líneas, el total y el estado de una venta registrada no se editan', async () => {
        for (const body of [ { detalles: [] }, { items: [] }, { totalPagado: 1 }, { estadoPedido: 'Entregado' } ]) {
            expectStatus(await request('PUT', `/api/sales/${ids.saleLateOctober._id}`, { token: tokens.admin, body }), 400);
        }

        assert.equal(kpi(await dashboard(), 'k1').value, '$74.000');
        expectStatus(await request('PATCH', `/api/sales/${ids.saleLateOctober._id}`, { token: tokens.employee, body: {} }), 403);
    });

    test('cancelar el pedido de una venta la saca de los indicadores', async () => {
        const order = await createOrder([ { ...PERRO, cantidad: 2 } ]);
        const { data: sale } = await sellOrder(order, '2026-11-13 09:00');

        assert.equal(kpi(await dashboard(), 'k1').value, '$98.000');

        expectStatus(await request('PATCH', `/api/orders/${order._id}`, { token: tokens.employee, body: { estado: 'Cancelado' } }), 200);
        assert.equal(expectStatus(await request('GET', `/api/sales/${sale._id}`, { token: tokens.employee }), 200).data.estadoPedido, 'Cancelado');
        assert.equal(kpi(await dashboard(), 'k1').value, '$74.000');

        expectStatus(await request('DELETE', `/api/sales/${sale._id}`, { token: tokens.admin }), 200);
    });

    test('eliminar la venta la descuenta de los indicadores', async () => {
        expectStatus(await request('DELETE', `/api/sales/${ids.saleLateOctober._id}`, { token: tokens.admin }), 200);
        expectStatus(await request('DELETE', `/api/sales/${ids.saleLateOctober._id}`, { token: tokens.admin }), 404);
        assert.equal(kpi(await dashboard(), 'k1').value, '$56.000');
    });
});

describe('Comentarios: ticket QR y visibilidad (isActive)', () => {
    test('un visitante comenta con el QR del ticket', async () => {
        const comment = expectStatus(await request('POST', '/api/comments', {
            body: { codigo: ids.saleA.qr, comentario: 'Excelente hamburguesa', calificacion: 5, isActive: false, likes: 99 }
        }), 201).data;

        assert.equal(comment.isActive, true);
        assert.equal(comment.likes, 0);
        assert.equal(comment.usuario, null);
        ids.commentA = comment._id;
    });

    test('un Cliente comenta; el personal no puede', async () => {
        expectStatus(await request('POST', '/api/comments', {
            token: tokens.employee, body: { codigo: ids.saleB.qr, comentario: 'x' }
        }), 403);

        const comment = expectStatus(await request('POST', '/api/comments', {
            token: tokens.client, body: { codigo: ids.saleB.qr, comentario: 'Bien, pero tardó', calificacion: 3 }
        }), 201).data;

        assert.equal(comment.usuario, ids.client);
        ids.commentB = comment._id;
    });

    test('reglas del ticket y validaciones', async () => {
        expectStatus(await request('POST', '/api/comments', { body: { codigo: ids.saleA.qr, comentario: 'otra vez' } }), 400);
        expectStatus(await request('POST', '/api/comments', { body: { codigo: 'TCK-FALSO', comentario: 'x' } }), 404);
        expectStatus(await request('POST', '/api/comments', { body: { codigo: { $ne: null }, comentario: 'x' } }), 400);
    });

    test('reseñas por producto en indicadores', async () => {
        const reviews = expectStatus(await request('GET', '/api/indicators/reviews', { token: tokens.admin }), 200);

        assert.deepEqual(reviews.map(({ name, count, score }) => ({ name, count, score })), [
            { name: 'Hamburguesa de res', count: 1, score: 5 },
            { name: 'Gaseosa', count: 1, score: 3 },
            { name: 'Perro Ranchero', count: 1, score: 3 }
        ]);
    });

    test('PATCH /:id/status oculta el comentario de la vista pública y de las reseñas', async () => {
        expectStatus(await request('PATCH', `/api/comments/${ids.commentA}/status`, { token: tokens.employee, body: { isActive: false } }), 403);

        const body = expectStatus(await request('PATCH', `/api/comments/${ids.commentA}/status`, { token: tokens.admin, body: { isActive: false } }), 200);
        assert.equal(body.msg, 'Comentario oculto');

        const publicList = expectStatus(await request('GET', '/api/comments/public'), 200).data;
        assert.deepEqual(publicList.map((comment) => comment._id), [ ids.commentB ]);
        assert.equal(publicList[0].codigo, undefined);
        assert.equal(publicList[0].usuario.name, 'Cliente Prueba');

        const reviews = expectStatus(await request('GET', '/api/indicators/reviews', { token: tokens.admin }), 200);
        assert.ok(!reviews.some((review) => review.name === 'Hamburguesa de res'));
    });

    test('gestión: filtros, obtener, actualizar y eliminar', async () => {
        assert.equal(expectStatus(await request('GET', '/api/comments?isActive=false', { token: tokens.employee }), 200).data.length, 1);
        assert.equal(expectStatus(await request('GET', '/api/comments', { token: tokens.employee }), 200).data.length, 2);
        expectStatus(await request('GET', `/api/comments/${ids.commentA}`, { token: tokens.employee }), 200);

        const updated = expectStatus(await request('PATCH', `/api/comments/${ids.commentA}`, {
            token: tokens.admin, body: { comentario: 'Editado', isActive: true, codigo: 'otro' }
        }), 200).data;
        assert.equal(updated.comentario, 'Editado');
        assert.equal(updated.isActive, false);
        assert.equal(updated.codigo, ids.saleA.qr);

        expectStatus(await request('PATCH', `/api/comments/${ids.commentA}`, { token: tokens.admin, body: { calificacion: 9 } }), 400);
        expectStatus(await request('DELETE', `/api/comments/${ids.commentA}`, { token: tokens.admin }), 200);
        expectStatus(await request('GET', `/api/comments/${ids.commentA}`, { token: tokens.admin }), 404);
    });
});

describe('Indicadores: regeneración y ventas antiguas', () => {
    test('rebuild normaliza fechas guardadas como texto y las incluye', async () => {
        await saleModel.collection.insertOne({
            idVenta: 'V-LEGACY',
            fecha: '2026-11-02 09:00',
            cliente: 'Consumidor Final',
            totalPagado: 10000,
            idTicketVenta: 'TCK-LEGACY',
            empleadoResponsable: 'Histórico',
            pedidoAsociado: new mongoose.Types.ObjectId(),
            estadoPedido: 'Entregado',
            direccionEntrega: 'Local',
            detalles: [ { producto: 'Perro Ranchero', cantidad: 1, precio_unitario: 10000, subtotal: 10000 } ],
            createdAt: new Date()
        });
        await dailyIndicatorModel.deleteMany({});

        const { data } = expectStatus(await request('POST', '/api/indicators/rebuild', { token: tokens.admin }), 200);

        assert.equal(data.normalizedSales, 1);
        assert.equal(data.consolidatedDays, 5);
        assert.equal(kpi(await dashboard(), 'k1').value, '$66.000');
        expectStatus(await request('POST', '/api/indicators/rebuild', { token: tokens.employee }), 403);
    });
});

describe('PQRS', () => {
    test('solo un Cliente registra; la administración gestiona', async () => {
        expectStatus(await request('POST', '/api/pqrs', { token: tokens.admin, body: { tipo: 'Queja', asunto: 'x', descripcion: 'x' } }), 403);
        expectStatus(await request('POST', '/api/pqrs', { token: tokens.client, body: { tipo: 'Otro', asunto: 'x', descripcion: 'x' } }), 400);

        const pqrs = expectStatus(await request('POST', '/api/pqrs', {
            token: tokens.client, body: { tipo: 'Sugerencia', asunto: 'Menú vegetariano', descripcion: 'Agreguen opciones' }
        }), 201).data;
        assert.equal(pqrs.usuario.email, 'cliente@cff.test');

        expectStatus(await request('GET', '/api/pqrs', { token: tokens.employee }), 200);
        expectStatus(await request('GET', `/api/pqrs/${pqrs._id}`, { token: tokens.employee }), 200);
        assert.equal(expectStatus(await request('PATCH', `/api/pqrs/${pqrs._id}`, { token: tokens.admin, body: { estado: 'Resuelto' } }), 200).data.estado, 'Resuelto');
        expectStatus(await request('DELETE', `/api/pqrs/${pqrs._id}`, { token: tokens.admin }), 200);
    });
});

describe('Establecimiento, horarios y ubicaciones', () => {
    const resources = {
        establecimiento: { titulo: 'Misión', contenido: 'Servir', categoria: 'Misión' },
        horarios: { dia: 'Lunes', horaApertura: '08:00', horaCierre: '22:00' },
        ubicaciones: { titulo: 'Sede', descripcion: 'Principal', direccion: 'Cl. 32 Sur', telefono: '3118370904' }
    };

    for (const [ path, body ] of Object.entries(resources)) {
        test(`CRUD de /api/${path}`, async () => {
            expectStatus(await request('POST', `/api/${path}`, { token: tokens.admin, body: {} }), 400);

            const created = expectStatus(await request('POST', `/api/${path}`, { token: tokens.admin, body }), 201).data;

            assert.equal(expectStatus(await request('GET', `/api/${path}`, { token: tokens.employee }), 200).data.length, 1);
            expectStatus(await request('GET', `/api/${path}/${created._id}`, { token: tokens.employee }), 200);
            expectStatus(await request('PATCH', `/api/${path}/${created._id}`, { token: tokens.admin, body: {} }), 200);
            expectStatus(await request('PATCH', `/api/${path}/${created._id}`, { token: tokens.employee, body: {} }), 403);
            expectStatus(await request('DELETE', `/api/${path}/${created._id}`, { token: tokens.admin }), 200);
            expectStatus(await request('GET', `/api/${path}/${created._id}`, { token: tokens.admin }), 404);
        });
    }
});

// saleId/ticketId consecutivos, qr aleatorio, campos immutable e índice parcial de orderId
describe('Identificadores: consecutivos, QR y ventas sin pedido', () => {
    // Último número entregado (una venta eliminada deja su número sin reutilizar)
    const lastSaleNumber = async () => (await counterModel.findById('sales').lean()).seq;

    const directSale = (extra = {}) => request('POST', '/api/sales', {
        token: tokens.employee, body: { fecha: '2020-01-15 10:00', items: toItems([ { ...GASEOSA, cantidad: 1 } ]), ...extra }
    });

    test('ventas directas (sin orderId, o con null) no chocan entre sí y siguen la secuencia', async () => {
        const last = await lastSaleNumber();
        const first = expectStatus(await directSale(), 201).data;
        const second = expectStatus(await directSale({ orderId: null }), 201).data;

        assert.equal(first.orderId, undefined);
        assert.equal(first.estadoPedido, 'Finalizado');
        assert.equal(first.saleId, last + 1);
        assert.equal(second.saleId, first.saleId + 1);
        assert.equal(second.ticketId, first.ticketId + 1);
        ids.directSale = first;
    });

    test('saleId, ticketId y qr del body se ignoran al crear y no se pueden editar', async () => {
        const created = expectStatus(await directSale({ saleId: 7000, ticketId: 7000, qr: 'QR-ELEGIDO' }), 201).data;
        assert.notEqual(created.saleId, 7000);
        assert.notEqual(created.qr, 'QR-ELEGIDO');

        const patched = expectStatus(await request('PATCH', `/api/sales/${created._id}`, {
            token: tokens.admin, body: { saleId: 1, ticketId: 1, qr: ids.saleA.qr, orderId: ids.orderA._id, cliente: 'Cliente editado' }
        }), 200).data;
        assert.equal(patched.cliente, 'Cliente editado');
        assert.equal(patched.saleId, created.saleId);
        assert.equal(patched.ticketId, created.ticketId);
        assert.equal(patched.qr, created.qr);
        assert.equal(patched.orderId, undefined);
    });

    test('una venta rechazada por validación no consume número', async () => {
        const last = await lastSaleNumber();

        // Fecha inválida: falla la validación del Schema, antes de pre('save')
        expectStatus(await directSale({ fecha: 'no-es-una-fecha' }), 400);
        assert.equal(expectStatus(await directSale(), 201).data.saleId, last + 1);
    });
});

// POST /api/sales con y sin orderId: items extra, reclamo atómico, compensación y estado Finalizado
describe('Ventas: venta de pedidos y ventas directas', () => {
    const sell = (body, token = tokens.employee) => request('POST', '/api/sales', { token, body: { fecha: '2020-02-10 12:00', ...body } });
    const getOrder = async (order) => expectStatus(await request('GET', `/api/orders/${order._id}`, { token: tokens.employee }), 200).data;

    test('venta con orderId e items: los items entran al pedido y la venta copia el pedido', async () => {
        const order = await createOrder([ { ...PERRO, cantidad: 1 } ]);
        const sale = expectStatus(await sell({ orderId: order._id, items: toItems([ { ...GASEOSA, cantidad: 2 }, { ...PERRO, cantidad: 1 } ]) }), 201).data;

        assert.deepEqual(sale.detalles.map(({ producto, cantidad, precio_unitario, subtotal }) => [ producto, cantidad, precio_unitario, subtotal ]), [
            [ PERRO.producto, 2, 12000, 24000 ],
            [ GASEOSA.producto, 2, 4000, 8000 ]
        ]);
        assert.equal(sale.totalPagado, 32000);

        const finished = await getOrder(order);
        assert.equal(finished.estado, 'Finalizado');
        assert.equal(finished.totalPedido, sale.totalPagado);
    });

    test('venta directa: precios del catálogo; precio, subtotal y total del cliente se ignoran', async () => {
        const sale = expectStatus(await sell({ items: toItems([ { ...HAMBURGUESA, cantidad: 1 }, { ...GASEOSA, cantidad: 3 } ]), totalPagado: 1, estadoPedido: 'Cancelado', empleadoResponsable: 'Otro' }), 201).data;

        assert.equal(sale.totalPagado, 18000 + 12000);
        assert.equal(sale.estadoPedido, 'Finalizado');
        assert.equal(sale.empleadoResponsable, 'Empleado Editado');
        assert.equal(sale.orderId, undefined);
    });

    test('la venta directa exige items válidos', async () => {
        expectStatus(await sell({}), 400);
        expectStatus(await sell({ detalles: [ { ...HAMBURGUESA, cantidad: 1 } ] }), 400);
        expectStatus(await sell({ items: [ { productId: '64b7f0c2a1b2c3d4e5f60718', quantity: 1 } ] }), 400);
        expectStatus(await sell({ orderId: { $ne: null } }), 400);
        expectStatus(await sell({ orderId: 'abc' }), 400);
    });

    test('un pedido entregado se puede vender, pero ya no admite items', async () => {
        const order = await createOrder([ { ...PERRO, cantidad: 1 } ], { estado: 'Entregado' });

        expectStatus(await sell({ orderId: order._id, items: toItems([ { ...GASEOSA, cantidad: 1 } ]) }), 409);
        assert.equal((await getOrder(order)).estado, 'Entregado');
        assert.equal(expectStatus(await sell({ orderId: order._id }), 201).data.totalPagado, 12000);
    });

    test('dos cajas venden el mismo pedido a la vez: una venta, las otras reciben 409', async () => {
        const order = await createOrder([ { ...HAMBURGUESA, cantidad: 1 } ]);
        const responses = await Promise.all(Array.from({ length: 4 }, () => sell({ orderId: order._id })));

        assert.deepEqual(responses.map(({ status }) => status).sort(), [ 201, 409, 409, 409 ]);
        assert.equal(await saleModel.countDocuments({ orderId: order._id }), 1);
        assert.equal((await getOrder(order)).estado, 'Finalizado');
    });

    test('si crear la venta falla, el pedido vuelve a su estado anterior', async () => {
        const order = await createOrder([ { ...PERRO, cantidad: 1 } ], { estado: 'Listo' });

        expectStatus(await sell({ orderId: order._id, fecha: 'no-es-una-fecha' }), 400);
        assert.equal((await getOrder(order)).estado, 'Listo');
        expectStatus(await sell({ orderId: order._id }), 201);
    });

    test('"Finalizado" solo lo asigna la venta y un pedido vendido solo puede cancelarse', async () => {
        expectStatus(await request('POST', '/api/orders', { token: tokens.employee, body: { items: toItems([ { ...PERRO, cantidad: 1 } ]), estado: 'Finalizado' } }), 400);

        const order = await createOrder([ { ...PERRO, cantidad: 1 } ]);
        const patch = (estado) => request('PATCH', `/api/orders/${order._id}`, { token: tokens.employee, body: { estado } });

        expectStatus(await patch('Finalizado'), 400);
        const sale = expectStatus(await sell({ orderId: order._id }), 201).data;

        expectStatus(await patch('Listo'), 409);
        expectStatus(await addItems(order, [ { ...PERRO, cantidad: 1 } ]), 409);
        expectStatus(await patch('Cancelado'), 200);
        assert.equal(expectStatus(await request('GET', `/api/sales/${sale._id}`, { token: tokens.employee }), 200).data.estadoPedido, 'Cancelado');
        // Cancelado tras la venta es definitivo
        expectStatus(await patch('En preparación'), 409);
        expectStatus(await sell({ orderId: order._id }), 409);
    });

    test('eliminar la venta de un pedido lo devuelve a "Listo" para corregirlo y venderlo de nuevo', async () => {
        const order = await createOrder([ { ...PERRO, cantidad: 1 } ]);
        const sale = expectStatus(await sell({ orderId: order._id }), 201).data;

        expectStatus(await request('DELETE', `/api/sales/${sale._id}`, { token: tokens.admin }), 200);
        assert.equal((await getOrder(order)).estado, 'Listo');
        expectStatus(await addItems(order, [ { ...GASEOSA, cantidad: 1 } ]), 200);
        assert.equal(expectStatus(await sell({ orderId: order._id }), 201).data.totalPagado, 16000);
    });

    test('Cliente no registra ventas', async () => {
        expectStatus(await sell({ items: toItems([ { ...PERRO, cantidad: 1 } ]) }, tokens.client), 403);
    });
});
