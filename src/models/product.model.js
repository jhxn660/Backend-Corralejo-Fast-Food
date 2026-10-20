import { Schema, model } from 'mongoose';

// Definir el schema (estructura de datos) para producto
const ProductSchema = new Schema({
    nombre: {
        minlength: 5,
        required: true,
        trim: true,
        type: String,
        unique: true
    },
    description: String,
    price: {
        type: Number,
        min: 0,
        default: 0,
    },
    stock: {
        type : Number,
        min: 0,
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
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'menu',
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

//Definir el modelo de datos
const ProductModel = model( 'product', ProductSchema);

// Exporto el modelo para que este disponible
export default ProductModel;