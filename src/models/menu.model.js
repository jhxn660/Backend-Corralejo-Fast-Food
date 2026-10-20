import {Schema, model} from "mongoose";

// Parte 1 Definir la estructura ed datos de mi documento
const menuSchema = new Schema({
    nombreCategoria: {
        type: String,           // Tipo dato
        required: true,         // Regla: es obligatorio
        trim: true              // Modificador
    },
    descripcion: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        trim: true,
        required: true
    },
    combo: {
        type: String,
        enum: ['Combobasico', 'Combomaster'],
        default: 'Combobasico'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'menu',
        default: null
    }
},{
    timestamps: true,        // Crea autmaticamente crear y modificar
    versionKey: false
});

// Parte 2 Definir el modelo, dicho modelo esta atado al nombre de documento
const menuModel = model(
    'menu',             // Nombre de la coleccion
    menuSchema          // Nombre del esquema que define la estructura de los datos
);

export default menuModel;
