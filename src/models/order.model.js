import { Schema, model } from "mongoose";

// Los detalles se embeben (sin _id propio) y guardan nombre y precio del producto
// como texto/valor: el pedido debe conservar lo que se cobró aunque el catálogo cambie.
const orderDetailSchema = new Schema({
    producto: {
        type: String,
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
    subtotal: {
        type: Number,
        required: [true, 'El subtotal del producto es obligatorio.']
    }
}, { _id: false });

const orderSchema = new Schema({
    numeroPedido: {
        type: Number,
        unique: true
    },
    estado: {
        type: String,
        enum: {
            values: ['En preparación', 'Listo', 'Entregado', 'Cancelado'],
            message: 'El estado "{VALUE}" no es válido. Solo se acepta: En preparación, Listo, Entregado o Cancelado.'
        }
    },
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
}, { timestamps: true });

// Nombre de modelo en inglés; la colección 'pedidos' se fija explícitamente para
// seguir leyendo los documentos creados antes del renombrado.
const orderModel = model('Order', orderSchema, 'pedidos');

export default orderModel;
