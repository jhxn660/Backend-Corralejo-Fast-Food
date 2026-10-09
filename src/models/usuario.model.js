import { Schema, model} from "mongoose";

// Parte 1: Definir la estructura de datos de mi Documento
const UsuarioSchema = new Schema({
    name: {
        type: String,       // Tipo Dato
        requiered: true,     // Regla: True: Obligatorio, False: No Obligatorio
        trim: true          // Modificador: de espacios elimina espacios primeros y ultimos
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
},{
    timestamps: true // Crea automaticamente createdAT, updatedAT
});

// Parte 2: Definir el modelo. Dicho modelo esta atado al nombre de documento
const UserModel = model();

export default UserModel;