import { Schema, model } from "mongoose";

// Definir el schema (estructura de datos) para producto
const InsumoSchema = new Schema({
    name: {
        type: String,
        unique: true,
        minlenght: 3,
        required: true,
        trim: true
    },
    description: String,
    medida: String,
    cost: {
        type: Number,
        min: 0,
        default: 0
    },
    stock: {
        type: Number,
        min: 0,
        default: 1
    },
    state: {
        type: String,
        enum: [ 'Con_Stock', 'Sin_Stock' ], default: 'Con_Stock'
    },
    // Quien registro el Insumo
    createdBy: {
        type: String,
        required: true
    }

}, {
    //Cuando fue creado el parametro
    timestamps: true,
    // elimina el "__V" de compass
    versionKey: false
});

// Definir el modelo de datos
const InsumoModel = model('insumo', InsumoSchema);

// Exporto el Modelo para que esté disponible
export default InsumoModel;