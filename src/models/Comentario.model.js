import { Schema, model } from 'mongoose';

const ComentarioSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario', // Relación con el modelo de Usuario
        required: [true, 'El usuario es obligatorio']
    },
    codigo: {
        type: String,
        required: [true, 'El código del comentario es obligatorio']
    },
    comentario: {
        type: String,
        required: [true, 'El texto del comentario es obligatorio']
    },
    likes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true, 
    versionKey: false
});

const ComentarioModel = model('comentario', ComentarioSchema);

export default ComentarioModel;