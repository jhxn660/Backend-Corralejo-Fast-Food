import { Schema, model } from 'mongoose';

// Definir el schema (estructura de datos) para producto
const ProductSchema = new Schema({
    nombre: {
        minlength: [5, 'El nombre del producto debe de tener al menos 5 caracteres'],
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true,
        type: String,
        // unique crea un índice en MongoDB, no es un validador: el duplicado llega como error 11000
        // (ver handle-mongoose-error) y un mensaje personalizado aquí nunca se mostraría.
        unique: true
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
    // Visibilidad en el Frontend: true = se muestra, false = oculto (borrado lógico).
    // Es independiente de `state`, que describe la situación logística del producto.
    // Solo se cambia desde PATCH /api/products/:id/status.
    isActive: {
        type: Boolean,
        default: true,
        index: true
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
