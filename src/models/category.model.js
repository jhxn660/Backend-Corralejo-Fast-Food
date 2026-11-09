import { Schema, model } from 'mongoose';

const CategorySchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre de la categoria es obligatorio'],
            trim: true,
            unique: true,
            minlength: [3, 'El nombre de la categoria debe tener al menos 3 caracteres'],
            maxlength: [100, 'El nombre de la categoria no puede superar 100 caracteres']
        },
        // Indica si la categoria agrupa productos o insumos (MER: categoria_tipo)
        type: {
            type: String,
            enum: {
                values: ['Producto', 'Insumo'],
                message: 'El tipo {VALUE} no es valido'  // {VALUE} muestra el valor que se envio
            },
            required: [true, 'El tipo de la categoria es obligatorio']
        },
        description: {
            type: String,
            required: false
        },
        // true = activa, false = inactiva
        status: {
            type: Boolean,
            default: true
        },
        // Usuario que registro la categoria
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',  // Permite traer los datos de ese usuario con populate
            required: [true, 'El usuario que registra la categoria es obligatorio']
        }
    },
    {
        timestamps: true,  // Crea createdAt y updatedAt automaticamente
        versionKey: false  // Elimina el campo __v
    }
);

// Mongoose crea la coleccion en plural: categories
const CategoryModel = model('category', CategorySchema);

export default CategoryModel;