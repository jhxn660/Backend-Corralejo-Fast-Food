import { Schema, model } from 'mongoose';
// Expresión regular para validar formato de correo electrónico:
// - ^                 : Inicio de la cadena
// - [a-zA-Z0-9._%+-]+ : Parte local / Usuario (letras, números, puntos, guiones, etc., al menos 1 carácter)
// - @                 : Arroba obligatoria que separa el usuario del dominio
// - [a-zA-Z0-9.-]+    : Nombre del dominio o proveedor (ej: gmail, sena, al menos 1 carácter)
// - \.                : Punto literal obligatorio antes de la extensión
// - [a-zA-Z]{2,}      : Dominio de nivel superior / TLD (solo letras, mínimo 2 caracteres: com, co, edu, org, etc.)
// - $                 : Fin de la cadena
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Expresión regular para validar contraseña segura:
// - (?=.*[a-z])                                  : Al menos una letra minúscula
// - (?=.*[A-Z])                                  : Al menos una letra mayúscula
// - (?=.*\d)                                     : Al menos un dígito numérico (alfanumérico)
// - (?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]): Al menos un símbolo o carácter especial
// - [^\s]{7,24}                                  : Más de 6 caracteres (mínimo 7) y máximo 24 caracteres, sin espacios

const phoneRegex = /^(?:\+57)?3[0-9]{9}$/;

// Parte 1: Definir la estructura de datos de mi Documento con validaciones y mensajes personalizados
const UserSchema = new Schema(
    // Definición de los campos del documento
    {
        // Reemplaza la tabla roles del MER
        role: {
            type: String,
            enum: {
                values: ['Administrador', 'Empleado', 'Cliente', 'Usuario', 'Owner'],
                message: 'El rol {VALUE} no es válido'  // {VALUE} muestra el valor que se envio
            },
            default: 'Cliente'
        },
        name: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,  // Quita los espacios al inicio y al final
            maxlength: [100, 'El nombre no puede superar 100 caracteres']
        },
        email: {
            type: String,
            required: [true, 'El correo es obligatorio'],
            trim: true,
            unique: true,  // No permite correos repetidos
            maxlength: [100, 'El correo no puede superar 100 caracteres'],
            lowercase: true, // lowercase: true, para que Ana@mail.com y ana@mail.com sean el mismo correo
            match: [emailRegex, 'El correo electrónico no tiene un formato válido']
        },
        // Guarda el hash de bcrypt, que ya incluye la sal (por eso no existe usuario_salt)
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            trim: true
        },
        // Celular colombiano: 3XXXXXXXXX, con o sin +57
        phone: {
            type: String,
            required: false,
            unique: true,
            sparse: true,  // Permite que varios usuarios no tengan telefono sin chocar con unique
            trim: true,
            match: [phoneRegex, 'Por favor ingrese un número de teléfono válido']
        },
        // true = activo, false = inactivo
        state: {
            type: Boolean,
            required: false,
            default: true
        },
        // Cargo del empleado. Pendiente: redefinir el tipo
        empleado_rol: {
            type: String,
            required: false,
            trim: true,
            maxlength: [30, 'El cargo del empleado no puede superar 30 caracteres']
        },
        // Usuario que registro a este usuario
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',  // Permite traer los datos de ese usuario con populate
            default: null
        }
    },
    {
        timestamps: true,  // Crea createdAt y updatedAt automaticamente
        versionKey: false  // Elimina el campo __v
    }
);

// Mongoose crea la coleccion en plural: users
const userModel = model('User', UserSchema);

export default userModel;
