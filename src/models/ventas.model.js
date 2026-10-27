import { Schema, model } from "mongoose";

const detalleVentaSchema = new Schema({
    producto: { 
        type: String, 
        required: [true, 'Debes especificar el nombre del producto vendido.'] 
    },
    cantidad: { 
        type: Number, 
        required: [true, 'Debes especificar la cantidad vendida.'],
        min: [1, 'La cantidad vendida debe ser de al menos 1.']
    },
    precio_unitario: { 
        type: Number, 
        required: [true, 'El precio unitario es requerido para facturación.'] 
    },
    subtotal: { 
        type: Number, 
        required: [true, 'El subtotal del producto es requerido en la venta.'] 
    }
}, { _id: false });

const ventasSchema = new Schema({
    idVenta: { 
        type: String, 
        required: [true, 'El ID alfanumérico de la venta es obligatorio (ej. V-10).'], 
        unique: true 
    },
    fecha: { 
        type: String, 
        required: [true, 'La fecha y hora de la venta es obligatoria.'] 
    },
    cliente: { 
        type: String, 
        required: [true, 'El nombre del cliente es obligatorio (puede ser "Consumidor Final").'] 
    },
    totalPagado: { 
        type: Number, 
        required: [true, 'El total pagado en caja es obligatorio.'],
        min: [0, 'El total pagado no puede ser un número negativo.']
    },
    idTicketVenta: { 
        type: String, 
        required: [true, 'El ID del ticket/factura es obligatorio.'], 
        unique: true 
    },
    empleadoResponsable: { 
        type: String, 
        required: [true, 'Debes registrar qué cajero o empleado realizó la venta.'] 
    },
    pedidoAsociado: { 
        type: Schema.Types.ObjectId, 
        ref: 'Pedido', 
        required: [true, 'Error crítico: Toda venta debe estar asociada al ID interno de un pedido previo.'] 
    },
    estadoPedido: { 
        type: String, 
        required: [true, 'El estado de entrega del pedido es obligatorio en la venta.'] 
    },
    direccionEntrega: { 
        type: String, 
        required: [true, 'La ubicación de entrega (ej. Local, Domicilio, Mesa 4) es obligatoria.'] 
    },
    detalles: {
        type: [detalleVentaSchema],
        validate: {
            validator: function(arreglo) {
                return arreglo != null && arreglo.length > 0;
            },
            message: 'Factura inválida: La venta debe contener al menos un producto facturado.'
        }
    }
}, { timestamps: true });

const ventasModel = model('Venta', ventasSchema);
export default ventasModel;