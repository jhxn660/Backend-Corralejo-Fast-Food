import { Schema, model } from 'mongoose';
import CategoryModel from './category.model.js';

const InsumoSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre del insumo es obligatorio'],
            trim: true,
            unique: true,
            minlength: [3, 'El nombre del insumo debe tener al menos 3 caracteres'],
            maxlength: [100, 'El nombre del insumo no puede superar 100 caracteres']
        },
        description: String,
        // Unidad de medida (ej: 10 KG, 5 Litros)
        medida: {
            type: String,
            maxlength: [50, 'La medida no puede superar 50 caracteres']
        },
        cost: {
            type: Number,
            min: [0, 'El costo no puede ser negativo'],
            default: 0
        },
        stock: {
            type: Number,
            min: [0, 'El stock no puede ser negativo'],
            default: 1
        },
        // Ojo: puede contradecir al stock (stock en 0 y estado 'Con_Stock')
        state: {
            type: String,
            enum: {
                values: ['Con_Stock', 'Sin_Stock'],
                message: 'El estado {VALUE} no es valido'  // {VALUE} muestra el valor que se envio
            },
            default: 'Con_Stock'
        },
        // Categoria a la que pertenece el insumo (MER: id_categoria)
        category: {
            type: Schema.Types.ObjectId,
            ref: 'category',  // Permite traer los datos de la categoria con populate
            required: [true, 'La categoria del insumo es obligatoria'],
            validate: {
                // Busca en la base de datos que la categoria exista y sea de tipo Insumo
                validator: async (id) => Boolean(await CategoryModel.exists({ _id: id, type: 'Insumo' })),
                message: 'La categoria no existe o no es de tipo Insumo'
            }
        },
        // Usuario que registro el insumo (MER: id_usuario)
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',  // Permite traer los datos de ese usuario con populate
            required: [true, 'El usuario que registra el insumo es obligatorio']
        }
    },
    {
        timestamps: true,  // Crea createdAt y updatedAt automaticamente
        versionKey: false  // Elimina el campo __v
    }
);

// Mongoose crea la coleccion en plural: insumos
const InsumoModel = model('insumo', InsumoSchema);

export default InsumoModel;