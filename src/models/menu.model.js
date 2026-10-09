import {Schema, model} from "mongoose";

// Parte 1 Definir la estructura ed datos de mi documento
const menuSchema = new Schema({
    name: {
        type: String,           // Tipo dato
        required: true,         // Regla: es obligatorio
        trim: true              // Modificador
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        trim: true,
        required: true
    }
},{
    timestamps: true        // Crea autmaticamente crear y modificar
});

// Parte 2 Definir el modelo, dicho modelo esta atado al nombre de documento
const menuModel = model();

export default menuModel;
