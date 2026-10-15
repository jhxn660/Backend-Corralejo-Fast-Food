import { Schema, model } from "mongoose";

// Subesquema: Detalle de cada producto
const detallePedidoSchema = new Schema({
    producto: {
        type: String, 
        required: true,
        trim: true
    },
    cantidad: {
        type: Number,
        required: true,
        min: [1, 'La cantidad mínima es 1']
    },
    precio_unitario: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false }); 

// Esquema Principal: El Pedido completo
const pedidoSchema = new Schema({
    numeroPedido: { 
        type: Number, 
        required: true, // ¡Muy importante para evitar el error E11000!
        unique: true
    },
    estado: {
        type: String,
        enum: ['Preparacion', 'En preparación', 'Resuelto', 'Cancelado'],
        default: 'En preparación'
    },
    hora: {
        type: String,
        trim: true
    },
    detalles: {
        type: [detallePedidoSchema], // Aquí se incrustan los subdocumentos
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'Un pedido debe tener al menos un producto (detalle).'
        }
    },
    totalPedido: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true 
});

const pedidoModel = model('Pedido', pedidoSchema);
export default pedidoModel;