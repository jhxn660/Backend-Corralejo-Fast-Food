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
// La política de contraseña NO vive aquí: el Schema solo recibe el hash de bcrypt. Ver passwordRegex en users.services.js.

const phoneRegex = /^(?:\+57)?3[0-9]{9}$/;

// Los roles de este enum son la fuente de verdad de todo el sistema (ver config/roles.config.js).
// Jerarquía (de mayor a menor): Owner > Administrador > Empleado > Cliente.
// 'Usuario' (visitante sin cuenta) NO es un rol persistido: quien no tiene documento en
// esta colección no puede tener rol. Vive solo como constante en roles.config.js.
const USER_ROLE_VALUES = Object.freeze(['Owner', 'Administrador', 'Empleado', 'Cliente']);

const UserSchema = new Schema(
    {
        // Reemplaza la tabla roles del MER
        role: {
            type: String,
            enum: {
                values: USER_ROLE_VALUES,
                message: 'El rol {VALUE} no es válido'  // {VALUE} muestra el valor que se envio
            },
            default: 'Cliente',
            index: true  // El panel del Owner lista por rol (Administrador / Empleado)
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
        status: {
            type: Boolean,
            required: false,
            default: true
        },
        // Cargo del empleado (texto libre, opcional)
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
        },
        // BAJA LÓGICA (eliminación de Administrador / Empleado por el Owner).
        // Users es referenciado por createdBy en categories, products, supplies, users,
        // y por pqrs y comments: un findOneAndDelete dejaría esas referencias colgando y
        // el populate devolvería null. La baja se marca aquí (status=false + deletedAt) y
        // el documento se conserva; dbGetUserByEmail y dbGetActiveUserById ya filtran
        // status:true, así que una cuenta dada de baja no puede iniciar sesión.
        deletedAt: {
            type: Date,
            default: null
        },
        // Quién dio de baja la cuenta (auditoría: debe ser un Owner)
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
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

export { USER_ROLE_VALUES };
export default userModel;
