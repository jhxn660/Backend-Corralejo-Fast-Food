import { Schema, model } from 'mongoose';

const PQRSSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
    },
    // Respuesta del restaurante a la solicitud. La escribe la administración con
    // PATCH /api/pqrs/:id y el Cliente la lee en GET /api/pqrs/mine. No tiene valor por defecto:
    // mientras no exista, la PQRS está «sin responder».
    respuesta: {
        type: String,
        trim: true,
        minlength: [10, 'La respuesta debe tener al menos 10 caracteres'],
        maxlength: [1000, 'La respuesta no puede superar 1000 caracteres']
    },
    // Quién respondió y cuándo. Los fija el servidor al guardar una respuesta (ver updatePQRS);
    // nunca se aceptan desde el body.
    respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    respondedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

const PQRSModel = model('pqrs', PQRSSchema);

export default PQRSModel;
