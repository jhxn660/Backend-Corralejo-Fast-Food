import { Schema, model } from 'mongoose';

const PQRSSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario', // Relación con el modelo de Usuario
        required: [true, 'El usuario es obligatorio']
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de solicitud es obligatorio'],
        enum: ['Petición', 'Queja', 'Reclamo', 'Sugerencia']
    },
    asunto: {
        type: String,
        required: [true, 'El asunto es obligatorio']
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria']
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'En proceso', 'Resuelto', 'Cerrado'],
        default: 'Pendiente'
    }
}, {
    timestamps: true,
    versionKey: false
});

const PQRSModel = model('pqrs', PQRSSchema);

export default PQRSModel;