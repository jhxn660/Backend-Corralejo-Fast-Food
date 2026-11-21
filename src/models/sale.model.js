import { randomBytes } from "node:crypto";
import { Schema, model } from "mongoose";
import { computeDetailTotals } from "./order.model.js";
import { nextFreeSequence } from "./counter.model.js";
import { parseBusinessDate } from "../helpers/business-date.helper.js";

// Código del QR: 8 bytes aleatorios (64 bits) en hexadecimal. Es la "llave" para comentar,
// así que debe ser imposible de adivinar; por eso no se deriva de saleId ni de ticketId.
const generateQrCode = () => `QR-${randomBytes(8).toString('hex').toUpperCase()}`;

// Las líneas se copian del pedido o se construyen desde el catálogo (order-details.services):
// nunca vienen con el precio del cliente.
const saleDetailSchema = new Schema({
    // Producto del catálogo. Opcional solo por las ventas anteriores a este campo.
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'product'
    },
    producto: {
        type: String,
        trim: true,
        required: [true, 'Debes especificar el nombre del producto vendido.']
    },
    cantidad: {
        type: Number,
        required: [true, 'Debes especificar la cantidad vendida.'],
        min: [1, 'La cantidad vendida debe ser de al menos 1.']
    },
    precio_unitario: {
        type: Number,
        required: [true, 'El precio unitario del producto vendido es obligatorio.'],
        min: [0, 'El precio unitario no puede ser un número negativo.']
    },
    // Lo calcula el servidor (cantidad × precio_unitario)
    subtotal: {
        type: Number,
        required: [true, 'El subtotal del producto es requerido en la venta.']
    },
    // true = la línea se vendió como combo (precio_unitario es el precio del combo)
    combo: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const saleSchema = new Schema({
    // Consecutivo interno de la venta (1, 2, 3…): identifica la venta en caja y en reportes.
    // Los tres identificadores los asigna el servidor al guardar por primera vez (hook de abajo)
    // y son `immutable`: Mongoose ignora cualquier intento de cambiarlos después.
    saleId: {
        type: Number,
        unique: true,
        immutable: true
    },
    // Consecutivo impreso en el ticket (1, 2, 3…): el número que leen el cajero y el cliente.
    // Tiene su propia secuencia para que la numeración de tickets no dependa de la de ventas.
    ticketId: {
        type: Number,
        unique: true,
        immutable: true
    },
    // Contenido del QR del ticket. Es secreto: quien lo tiene puede publicar UN comentario.
    // Ver "ARQUITECTURA.md > Ticket y QR".
    qr: {
        type: String,
        unique: true,
        immutable: true
    },
    // Instante de la venta. Si no se envía es el momento del registro; un texto sin zona
    // horaria se interpreta en la hora del negocio. Los indicadores se agrupan por este campo.
    fecha: {
        type: Date,
        default: Date.now,
        set: parseBusinessDate,
        index: true
    },
    cliente: {
        type: String,
        trim: true,
        default: 'Consumidor Final'
    },
    // Suma de los subtotales; lo calcula el servidor (hook de abajo)
    totalPagado: {
        type: Number,
        required: [true, 'El total pagado en caja es obligatorio.'],
        min: [0, 'El total pagado no puede ser un número negativo.']
    },
    empleadoResponsable: {
        type: String,
        trim: true,
        required: [true, 'Debes registrar qué cajero o empleado realizó la venta.']
    },
    // Pedido que origina la venta. Opcional: una venta directa en caja no tiene pedido,
    // y un pedido puede quedar abierto sin venderse nunca. La unicidad está en el índice de abajo.
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: false,
        immutable: true
    },
    estadoPedido: {
        type: String,
        trim: true,
        // Copia del estado del pedido: toda venta nace 'Finalizado' y sigue al pedido si este se
        // cancela (dbSyncOrderStatus). Las ventas 'Cancelado' no cuentan en los indicadores.
        default: 'Finalizado'
    },
    direccionEntrega: {
        type: String,
        trim: true,
        default: 'Local'
    },
    // Insumos que esta venta descontó del inventario. Se guardan para devolver EXACTAMENTE
    // eso si la venta se elimina, aunque la receta haya cambiado después.
    consumoInsumos: {
        type: [{
            supply: { type: Schema.Types.ObjectId, ref: 'Supply' },
            cantidad: Number
        }],
        _id: false,
        default: []
    },
    detalles: {
        type: [saleDetailSchema],
        validate: {
            validator: function(arreglo) {
                return arreglo != null && arreglo.length > 0;
            },
            message: 'Venta inválida: debe contener al menos un producto.'
        }
    }
}, { timestamps: true });

// Un pedido se vende una sola vez, aunque dos cajas lo intenten a la vez. El índice es parcial
// (solo cuenta cuando orderId es un ObjectId): con `unique` en el campo, dos ventas directas
// chocarían entre sí por compartir el valor null.
saleSchema.index({ orderId: 1 }, { unique: true, partialFilterExpression: { orderId: { $type: 'objectId' } } });

// totalPagado es siempre la suma de las líneas. Solo se recalcula al crear (o si cambian las
// líneas): así las ventas antiguas, que podían traer otro total, no cambian al editar su fecha.
saleSchema.pre('validate', function () {
    if (this.isNew || this.isModified('detalles')) {
        this.totalPagado = computeDetailTotals(this.detalles);
    }
});

// pre('save') corre DESPUÉS de validar: una venta rechazada no consume números y la secuencia
// no tiene huecos (solo podría saltarse un número si la escritura falla en la propia BD).
// Lo que llegue en el body para estos campos se descarta. insertMany() no ejecuta este hook.
saleSchema.pre('save', async function () {
    if (!this.isNew) return;

    this.saleId = await nextFreeSequence(this.constructor, 'saleId', 'sales');
    this.ticketId = await nextFreeSequence(this.constructor, 'ticketId', 'tickets');
    this.qr = generateQrCode();
});

// Nombre de modelo en inglés; la colección 'ventas' se fija explícitamente para
// seguir leyendo los documentos creados antes del renombrado.
const saleModel = model('Sale', saleSchema, 'ventas');

export { generateQrCode };
export default saleModel;
