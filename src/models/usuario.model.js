import { Schema, model } from "mongoose";

// Parte 1: Definir la estructura de datos de mi Documento
const UsuarioSchema = new Schema({
    role: {
        type: String,
        enum: {
            values: ['Administrador', 'Empleado', 'Usuario', 'UsuarioT' ]
        },
        ref: 'role',
        required: true,
        default: 'Usuario'
    },
    name: {
        type: String,       // Tipo Dato
        requiered: true,     // Regla: True: Obligatorio, False: No Obligatorio
        trim: true,          // Modificador: de espacios elimina espacios primeros y ultimos
        maxlenght: 100
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxlenght: 100
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: false,
        trim: true,
        match: [ /^(?:\+57)?3[0-9]{9}$/, 'Por favor ingrese un número de teléfono válido' ]
    },
    state: {
        type: Boolean,
        required: false,
        default: true
    },
    empleado_rol: {
        type: String, // Redifinir el tipo
        required: false,
        trim: true,
        maxlenght: 30
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    }

},
    // Opciones del esquema
    {
        timestamps: true, // Crea automaticamente createdAT, updatedAT
        versionKey: false // Elimina el __V
    }
);

// Parte 2: Definir el modelo. Dicho modelo esta atado al nombre de documento
const usuarioModel = model(
    'Usuario',         // Nombre de la colección (pluraliza automaticamente)
    UsuarioSchema   // Nombre del esquema que define la estructura de los documentos
);

export default usuarioModel;