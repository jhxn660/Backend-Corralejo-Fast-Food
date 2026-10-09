import { Schema, model } from "mongoose";

//Parte 1: Definir la estructura de datos del Documento
const pedidoSchema = new Schema({
    clientname: { 
        type: String,               //Tipo dato
        required: true,             //Regla: Es obligatorio
        trim: true                  //Modificador: Elimina espacios al inicio y final
    },
    clientemail: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    }
});

//Parte 2: Definir el modelo. Dicho modelo está atado al nombre de documento
const pedidoModel = model();


export default pedidoModel;