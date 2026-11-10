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
        // CAMBIO: el valor por defecto tenía una errata ('dispoible') que no existe en el enum,
        // por lo que crear un producto sin `state` fallaba la validación.
        default: 'disponible'
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'category',
        required: [true, 'El ID de la categoria es obligatorio']
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        // CAMBIO: antes apuntaba a 'menu', un modelo inexistente. Quien registra el producto es un
        // usuario del sistema (rol 'Empleado' o 'Administrador'), así que se referencia a 'User'.
        ref: 'User',
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
