import { Schema, model } from 'mongoose';

const CommentSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        // CAMBIO: antes apuntaba a 'Usuario', un modelo que ya no está registrado (ahora es 'User');
        // con la referencia antigua cualquier populate fallaba con MissingSchemaError.
        ref: 'User',
        // CAMBIO: deja de ser obligatorio. Un visitante sin cuenta ('Usuario') también puede
        // comentar; en ese caso el autor queda en null y la legitimidad la aporta el ticket.
        default: null
    },
    // CAMBIO: venta que respalda el comentario. La resuelve el Backend a partir del QR;
    // nunca se acepta desde el body.
    venta: {
        type: Schema.Types.ObjectId,
        ref: 'Sale',
        required: [true, 'El comentario debe estar vinculado a una venta']
    },
    codigo: {
        type: String,
        // Contenido leído del QR del ticket de compra (`qr` de la venta)
        required: [true, 'El código del comentario es obligatorio']
    },
    comentario: {
        type: String,
        required: [true, 'El texto del comentario es obligatorio']
    },
    likes: {
        type: Number,
        default: 0
    },
    // Valoración opcional de la compra (1 a 5). Alimenta "Productos Mejor Valorados" en Indicadores.
    calificacion: {
        type: Number,
        min: [1, 'La calificación mínima es 1'],
        max: [5, 'La calificación máxima es 5'],
        validate: {
            validator: Number.isInteger,
            message: 'La calificación debe ser un número entero entre 1 y 5'
        }
    },
    // Visibilidad en el Frontend (moderación): true = se muestra, false = oculto.
    // Solo se cambia desde PATCH /api/comments/:id/status.
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Nombre de modelo en inglés; la colección 'comentarios' se fija explícitamente para
// seguir leyendo los documentos creados antes del renombrado.
const CommentModel = model('Comment', CommentSchema, 'comentarios');

export default CommentModel;
