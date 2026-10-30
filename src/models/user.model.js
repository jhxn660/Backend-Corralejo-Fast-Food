import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
    {
        // Reemplaza la tabla roles del MER
        role: {
            type: String,
            enum: {
                values: ['Administrador', 'Empleado', 'Usuario', 'UsuarioT'],
                message: 'El rol {VALUE} no es valido'  // {VALUE} muestra el valor que se envio
            },
            required: [true, 'El rol es obligatorio'],
            default: 'Usuario'
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
            maxlength: [100, 'El correo no puede superar 100 caracteres']
            // Pendiente: lowercase: true, para que Ana@mail.com y ana@mail.com sean el mismo correo
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
            match: [/^(?:\+57)?3[0-9]{9}$/, 'Por favor ingrese un número de teléfono válido']
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