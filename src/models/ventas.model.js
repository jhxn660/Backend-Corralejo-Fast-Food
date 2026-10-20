import { Schema, model } from "mongoose";

// Subesquema para los detalles de los productos facturados
const detalleVentasSchema = new Schema({
    producto: {
        type: String, 
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    precio_unitario: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    }
}, { _id: false });

// Esquema Principal de la Venta
const ventasSchema = new Schema({
    idVenta: { 
        type: String, // Ej: "V-3"
        required: true,
        unique: true
    },
    fecha: {
        type: String, // Ej: "05/10 1:17 PM"
        required: true
    },
    cliente: {
        type: String,
        default: 'Consumidor Final'
    },
    totalPagado: {
        type: Number,
        required: true
    },
    idTicketVenta: {
        type: String, // Ej: "T-0003"
        required: true,
        unique: true
    },
    empleadoResponsable: {
        type: String, // Ej: "E-007"
        required: true
    },
    pedidoAsociado: {
        type: String, // Ej: "P-224"
        required: true
    },
    estadoPedido: {
        type: String, // Ej: "Entregado"
        required: true
    },
    direccionEntrega: {
        type: String, // Ej: "Local / Mostrador"
        required: true
    },
    detalles: {
        type: [detalleVentasSchema], 
        required: true
    }
}, {
    timestamps: true 
});

const ventasModel = model('Venta', ventasSchema);
export default ventasModel;