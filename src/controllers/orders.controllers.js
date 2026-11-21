import asyncHandler from "../helpers/async-handler.helper.js";
import { assertFound, HttpError } from "../helpers/http-error.helper.js";
import { parseItems } from "../helpers/order-items.helper.js";
import {
    dbAddOrderItems,
    dbReplaceOrderItems,
    dbCreateOrder,
    dbDeleteOrder,
    dbReadOrderById,
    dbReadOrders,
    dbUpdateOrder
} from "../services/orders.services.js";

const NOT_FOUND = 'Pedido no encontrado';

// Body: { items: [{ productId, quantity }], estado? }. Precios, subtotales, total y
// orderNumber los pone el servidor; cualquier otro campo del body se ignora.
// POST /api/orders  { items?: [{ productId, quantity, combo? }], estado? }
// Sin `items` se crea un pedido vacío al que luego se le añaden productos.
const createOrder = asyncHandler(async (req, res) => {
    const items = req.body.items === undefined ? [] : parseItems(req.body.items, { allowEmpty: true });
    const data = await dbCreateOrder({ items, estado: req.body.estado });

    res.status(201).json({ msg: 'Pedido creado', data });
}, 'Error al crear el pedido');

// ?estado=En preparación|Listo|Entregado|Cancelado
const getOrders = asyncHandler(async (req, res) => {
    const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;

    res.json({ msg: 'Pedidos obtenidos', data: await dbReadOrders({ estado }) });
}, 'Error al obtener los pedidos');

const getOrder = asyncHandler(async (req, res) => {
    res.json({ msg: 'Pedido obtenido', data: assertFound(await dbReadOrderById(req.params.id), NOT_FOUND) });
}, 'Error al obtener el pedido');

// POST /api/orders/:id/items  { items: [{ productId, quantity }] }
const addOrderItems = asyncHandler(async (req, res) => {
    const data = assertFound(await dbAddOrderItems(req.params.id, parseItems(req.body.items)), NOT_FOUND);

    res.json({ msg: 'Productos añadidos al pedido', data });
}, 'Error al añadir productos al pedido');

// PUT y PATCH comparten handler y solo cambian `estado`. Los productos no se editan por aquí:
// se responde 400 en lugar de ignorarlos para que el cliente sepa qué ruta usar.
// PUT /api/orders/:id/items  { items: [{ productId, quantity, combo? }] }
// REEMPLAZA todos los productos del pedido: sirve para quitar uno o cambiar cantidades.
// Una lista vacía deja el pedido vacío. Solo mientras el pedido esté abierto y sin venta.
const replaceOrderItems = asyncHandler(async (req, res) => {
    const items = parseItems(req.body.items, { allowEmpty: true });
    const data = assertFound(await dbReplaceOrderItems(req.params.id, items), NOT_FOUND);

    res.json({ msg: 'Productos del pedido actualizados', data });
}, 'Error al actualizar los productos del pedido');

const updateOrder = asyncHandler(async (req, res) => {
    if ('items' in req.body || 'detalles' in req.body) {
        throw new HttpError(400, 'Los productos no se editan por esta ruta. Usa POST /api/orders/:id/items para añadirlos');
    }

    res.json({ msg: 'Pedido actualizado', data: assertFound(await dbUpdateOrder(req.params.id, req.body), NOT_FOUND) });
}, 'Error al actualizar el pedido');

const deleteOrder = asyncHandler(async (req, res) => {
    res.json({ msg: 'Pedido eliminado', data: assertFound(await dbDeleteOrder(req.params.id), NOT_FOUND) });
}, 'Error al eliminar el pedido');

export {
    createOrder,
    getOrders,
    getOrder,
    addOrderItems,
    replaceOrderItems,
    updateOrder,
    deleteOrder
};
