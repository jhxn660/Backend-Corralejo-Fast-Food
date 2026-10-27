import { Schema, model } from "mongoose";

const detallePedidoSchema = new Schema({
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

const pedidoSchema = new Schema({
    numeroPedido: { 
        type: Number, 
        required: [true, 'El número de pedido consecutivo es obligatorio.'], 
        unique: true 
    },
    estado: { 
        type: String, 
        required: [true, 'El estado del pedido es obligatorio.'],
        enum: {
            values: ['En preparación', 'Listo', 'Entregado', 'Cancelado'],
            message: 'El estado "{VALUE}" no es válido. Solo se acepta: En preparación, Listo, Entregado o Cancelado.'
        }
    },
    hora: { 
        type: String, 
        required: [true, 'La hora de recepción del pedido es obligatoria.'] 
    },
    totalPedido: { 
        type: Number, 
        required: [true, 'El total a pagar del pedido es obligatorio.'],
        min: [0, 'El total del pedido no puede ser un valor negativo.']
    },
    detalles: {
        type: [detallePedidoSchema],
        validate: {
            // Esta función verifica que el arreglo exista y tenga al menos 1 elemento
            validator: function(arreglo) {
                return arreglo != null && arreglo.length > 0;
            },
            message: 'Un pedido no puede estar vacío. Debes agregar al menos 1 producto en los detalles.'
        }
    }
}, { timestamps: true });

const pedidoModel = model('Pedido', pedidoSchema);
export default pedidoModel;