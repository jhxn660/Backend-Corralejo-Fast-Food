import { Schema, model } from "mongoose";
import { nextFreeSequence } from "./counter.model.js";

// Los detalles se embeben (sin _id propio) y copian nombre y precio del producto al momento
// de pedirlo: el pedido debe conservar el precio con el que se vendió aunque el catálogo cambie.
// Los rellena el servidor desde el catálogo (order-details.services); nunca vienen del body.
const orderDetailSchema = new Schema({
    // Producto del catálogo. Opcional solo por los pedidos anteriores a este campo.
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'product'
    },
    producto: {
        type: String,
        trim: true,
        required: [true, 'El nombre del producto es obligatorio.']
    },
    cantidad: {
        type: Number,
        required: [true, 'Debes ingresar la cantidad del producto.'],
        min: [1, 'La cantidad mínima por producto debe ser al menos 1. No puedes registrar 0.']
    },
    precio_unitario: {
        type: Number,
        required: [true, 'El precio unitario del producto es obligatorio.'],
        min: [0, 'El precio unitario no puede ser un número negativo.']
    },
    // Obligatorio, pero nunca se confía en el del cliente: el hook de abajo lo recalcula siempre
    subtotal: {
        type: Number,
        required: [true, 'El subtotal del producto es obligatorio.']
    }
}, { _id: false });

const orderSchema = new Schema({
    // Consecutivo del pedido (1, 2, 3…). Lo asigna siempre el servidor al guardar por primera vez;
    // `immutable` hace que Mongoose ignore cualquier intento de cambiarlo después.
    orderNumber: {
        type: Number,
        unique: true,
        immutable: true
    },
    estado: {
        type: String,
        enum: {
            // 'Finalizado' solo lo asigna el servidor al registrar la venta (ver order-details.services)
            values: ['En preparación', 'Listo', 'Entregado', 'Finalizado', 'Cancelado'],
            message: 'El estado "{VALUE}" no es válido. Solo se acepta: En preparación, Listo, Entregado, Finalizado o Cancelado.'
        },
        default: 'En preparación'
    },
    // Lo calcula el servidor (suma de subtotales)
    totalPedido: {
        type: Number,
        required: [true, 'El total a pagar del pedido es obligatorio.'],
        min: [0, 'El total del pedido no puede ser un valor negativo.']
    },
    detalles: {
        type: [orderDetailSchema],
        validate: {
            // `required` no basta en arreglos: Mongoose los inicializa como [] y pasarían vacíos
            validator: (detalles) => detalles != null && detalles.length > 0,
            message: 'Un pedido no puede estar vacío. Debes agregar al menos 1 producto en los detalles.'
        }
    }
}, {
    timestamps: true,
    // Cada save() comprueba que nadie haya guardado el pedido desde que se leyó. Si dos cajas
    // añaden productos a la vez, la segunda recibe 409 en lugar de pisar los cambios de la primera.
    optimisticConcurrency: true
});

/**
 * Recalcula los subtotales de un arreglo de detalles y devuelve su suma. Los importes que
 * envía el cliente no son de fiar: una resta mal hecha en el navegador acabaría en los indicadores.
 * La comparte el modelo de ventas.
 */
const computeDetailTotals = (detalles = []) => detalles.reduce((total, detalle) => {
    if (Number.isFinite(detalle.cantidad) && Number.isFinite(detalle.precio_unitario)) {
        detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
    }

    return total + (detalle.subtotal ?? 0);
}, 0);

orderSchema.pre('validate', function () {
    this.totalPedido = computeDetailTotals(this.detalles);
});

// Tras validar (un pedido inválido no consume número). Se ignora el número que envíe el cliente.
orderSchema.pre('save', async function () {
    if (this.isNew) {
        this.orderNumber = await nextFreeSequence(this.constructor, 'orderNumber', 'orders');
    }
});

// Nombre de modelo en inglés; la colección 'pedidos' se fija explícitamente para
// seguir leyendo los documentos creados antes del renombrado.
const orderModel = model('Order', orderSchema, 'pedidos');

export { computeDetailTotals };
export default orderModel;
