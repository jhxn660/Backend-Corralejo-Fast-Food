import { Schema, model } from 'mongoose';

// Definir el schema (estructura de datos) para producto
const ProductSchema = new Schema({
    nombre: {
        minlength: [5, 'El nombre del producto debe de tener al menos 5 caracteres'],
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true,
        type: String,
        unique: [true, 'El nombre de este producto ya esta registrado']
    },
    description: String,
    price: {
        type: Number,
        min: [0, 'El precio no puede ser negativo'],
        default: 0,
    },
    stock: {
        type : Number,
        min: [0, 'El inventario no puede ser negativo'],
        default: 1
    },
    state: {
        type: String,
        enum: [ 
            'disponible', 
            'en garantia', 
            'entregado', 
            'pendiente', 
            'en transito'
        ],
        default: 'dispoible'
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'category',
        required: [true, 'El ID de la categoria es obligatorio']
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'menu',
        required: [true, 'El ID del usuario que registra es obligatorio']
    }
}, {
    timestamps: true,
    versionKey: false
});

//Definir el modelo de datos
const ProductModel = model( 'product', ProductSchema);

// Exporto el modelo para que este disponible
export default ProductModel;