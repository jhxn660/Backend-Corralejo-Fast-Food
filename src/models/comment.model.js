import { Schema, model } from 'mongoose';

const CommentSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        // No es obligatorio: un visitante sin cuenta ('Usuario') también puede comentar; en ese caso
        // el autor queda en null y la legitimidad la aporta el ticket.
        default: null
    },
    // Venta que respalda el comentario. La resuelve el backend a partir del QR; nunca se acepta
    // desde el body.
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
    // No es obligatorio: se puede puntuar sin escribir. Lo que se exige es texto O valoración
    // (ver pre('validate')).
    comentario: {
        type: String,
        trim: true,
        default: '',
        maxlength: [300, 'El comentario no puede superar 300 caracteres']
    },
    // Contador desnormalizado de "me gusta". La fuente de verdad es `likedBy`:
    // un número suelto lo infla cualquiera; con un registro por usuario el
    // segundo clic quita el suyo. Lo mantienen POST / DELETE /api/comments/:id/like
    // (dbLikeComment / dbUnlikeComment: $addToSet / $pull + $inc en una sola operación).
    likes: {
        type: Number,
        default: 0,
        min: [0, 'Los likes no pueden ser negativos']
    },
    // Quién dio «me gusta». Solo usuarios con cuenta: un visitante sin token no tiene identidad a
    // la que atribuirlo.
    likedBy: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        default: [],
        select: false  // no viaja en los listados; se resuelve como `likedByMe` (dbGetPublicComments)
    },
    // Valoración de la compra: entero 1-10 sobre 5 estrellas (cada unidad es media estrella:
    // 1 = ½★ … 10 = 5★). Es la escala del frontend.
    valoracion: {
        type: Number,
        min: [1, 'La valoración mínima es 1'],
        max: [10, 'La valoración máxima es 10'],
        validate: {
            validator: Number.isInteger,
            message: 'La valoración debe ser un número entero entre 1 y 10'
        }
    },
    // Valoración 1-5 (escala anterior). Alimenta las estrellas por producto y «Productos mejor
    // valorados» en Indicadores. Si llega `valoracion`, se deriva de ella (pre('validate')).
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
    status: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Al crear: texto o valoración (una puntuación sola es válida), y la escala
// legado 1-5 se deriva de la nueva 1-10 cuando solo llega esta.
CommentSchema.pre('validate', function () {
    if (Number.isInteger(this.valoracion) && this.calificacion == null) {
        this.calificacion = Math.min(5, Math.max(1, Math.round(this.valoracion / 2)));
    }

    const sinTexto = !this.comentario || !this.comentario.trim();
    if (sinTexto && this.valoracion == null && this.calificacion == null) {
        this.invalidate('comentario', 'Debe enviar un comentario o una valoración');
    }
});

// Nombre de modelo en inglés; la colección 'comentarios' se fija explícitamente para
// seguir leyendo los documentos creados antes del renombrado.
const CommentModel = model('Comment', CommentSchema, 'comentarios');

export default CommentModel;
