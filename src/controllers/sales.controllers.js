import mongoose from "mongoose";
import asyncHandler from "../helpers/async-handler.helper.js";
import { parseItems } from "../helpers/order-items.helper.js";
import { assertFound, HttpError } from "../helpers/http-error.helper.js";
import { isValidDayKey } from "../helpers/business-date.helper.js";
import { STAFF_ROLES } from "../config/roles.config.js";
import {
    dbDeleteSale,
    dbReadSaleById,
    dbReadSales,
    dbRegisterSale,
    dbUpdateSale
} from "../services/sales.services.js";

const NOT_FOUND = 'Venta no encontrada';

// Únicos campos de una venta que el cliente puede definir (al crear) o corregir (al editar).
// Líneas, total, estado, empleado e identificadores los fija el servidor.
const EDITABLE_FIELDS = Object.freeze([ 'fecha', 'cliente', 'direccionEntrega' ]);
const LOCKED_FIELDS = Object.freeze([ 'detalles', 'items', 'totalPagado', 'estadoPedido' ]);

const pickEditable = (body) => Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => body[field] !== undefined).map((field) => [ field, body[field] ])
);

// Toda escritura en ventas informa si los indicadores quedaron al día
const sendSaleResult = (res, status, msg, { sale, indicatorsUpdated }) => {
    res.status(status).json({
        msg: indicatorsUpdated
            ? msg
            : `${msg} Los indicadores no se pudieron actualizar: ejecuta POST /api/indicators/rebuild.`,
        data: sale,
        indicatorsUpdated
    });
};

/**
 * Body: { orderId?, items?: [{ productId, quantity }], fecha?, cliente?, direccionEntrega? }
 *   - Con orderId: registra la venta de ese pedido; items (opcional) se añaden al pedido antes.
 *   - Sin orderId (o null): venta directa; items es obligatorio.
 */
const createSale = asyncHandler(async (req, res) => {
    const { orderId, items } = req.body;
    const hasOrder = orderId !== undefined && orderId !== null;

    // Texto de 24 hex: un objeto como { "$ne": null } sería un operador de consulta
    if (hasOrder && !(typeof orderId === 'string' && mongoose.isObjectIdOrHexString(orderId))) {
        throw new HttpError(400, 'orderId inválido', { orderId: 'Debe ser el _id de un pedido' });
    }

    const result = await dbRegisterSale({
        orderId: hasOrder ? orderId : undefined,
        items: !hasOrder || items !== undefined ? parseItems(items) : undefined,
        fields: pickEditable(req.body)
    }, req.userFound);

    sendSaleResult(res, 201, '¡Venta registrada con éxito y métricas actualizadas!', result);
}, 'Error al registrar la venta');

// ?from=YYYY-MM-DD&to=YYYY-MM-DD (días de negocio, ambos incluidos)
const getSales = asyncHandler(async (req, res) => {
    const { from, to } = req.query;

    for (const [ name, value ] of Object.entries({ from, to })) {
        if (value !== undefined && !isValidDayKey(value)) {
            throw new HttpError(400, `El parámetro '${name}' debe tener el formato YYYY-MM-DD`);
        }
    }

    const sales = await dbReadSales({ from, to });

    // El personal ve todo. Para los demás se arma una versión reducida: solo lo necesario
    // para contar qué producto se vendió más, sin datos de personas.
    const isStaff = STAFF_ROLES.includes(req.userFound?.role);
    const data = isStaff
        ? sales
        : sales.map((sale) => ({
            fecha: sale.fecha,
            estadoPedido: sale.estadoPedido,
            detalles: sale.detalles.map(({ producto, cantidad }) => ({ producto, cantidad }))
        }));

    res.json({ msg: 'Ventas obtenidas', data });
}, 'Error al obtener las ventas');

const getSale = asyncHandler(async (req, res) => {
    res.json({ msg: 'Venta obtenida', data: assertFound(await dbReadSaleById(req.params.id), NOT_FOUND) });
}, 'Error al obtener la venta');

// PUT y PATCH comparten handler. Solo corrigen datos de registro (EDITABLE_FIELDS).
// Una venta registrada no cambia sus líneas ni su total: se responde 400 en lugar de ignorarlos para
// que quien llama sepa cómo corregirla. Los identificadores (saleId, qr…) se ignoran (immutable).
const updateSale = asyncHandler(async (req, res) => {
    const locked = LOCKED_FIELDS.filter((field) => field in req.body);

    if (locked.length) {
        throw new HttpError(400, `No se puede editar ${locked.join(', ')} de una venta registrada. Para corregirla, cancela su pedido (o elimina la venta) y registra una nueva`);
    }

    const result = assertFound(await dbUpdateSale(req.params.id, pickEditable(req.body)), NOT_FOUND);

    sendSaleResult(res, 200, 'Venta actualizada', result);
}, 'Error al actualizar la venta');

const deleteSale = asyncHandler(async (req, res) => {
    const result = assertFound(await dbDeleteSale(req.params.id), NOT_FOUND);

    sendSaleResult(res, 200, 'Venta eliminada', result);
}, 'Error al eliminar la venta');

export {
    createSale,
    getSales,
    getSale,
    updateSale,
    deleteSale
};
