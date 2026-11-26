import { Schema, model } from 'mongoose';

const ProductSchema = new Schema({
    name: {
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
    // Visibilidad en el Frontend: true = se muestra, false = oculto (borrado lógico).
    // Solo se cambia desde PATCH /api/products/:id/status.
    status: {
        type: Boolean,
        default: true,
        index: true
    },
    // Imágenes del producto. `url`: dirección de la imagen; `isMain`: la que se muestra primero.
    images: {
        type: [{
            url: { type: String, required: [true, 'Cada imagen necesita su url'] },
            isMain: { type: Boolean, default: false }
        }],
        _id: false,
        default: []
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'category',
        required: [true, 'El ID de la categoria es obligatorio']
    },
    // COMBO = un producto que agrupa productos ya hechos (ej. 1 Hamburguesa + 1 Papas).
    // Lista vacía = producto normal. Se vende como cualquier producto y, al venderse, gasta las
    // recetas de los productos que agrupa. Las reglas (que existan, que no sean otros combos…)
    // están en products.services.js (prepareCombo).
    comboItems: {
        type: [{
            product: {
                type: Schema.Types.ObjectId,
                ref: 'product',
                required: [true, 'Cada producto del combo necesita su ID']
            },
            quantity: {
                type: Number,
                default: 1,
                min: [1, 'La cantidad de cada producto del combo debe ser al menos 1'],
                validate: {
                    validator: Number.isInteger,
                    message: 'La cantidad de cada producto del combo debe ser un número entero'
                }
            }
        }],
        _id: false,
        default: []
    },
    // Cómo se fija el precio de un combo.
    //   'sum'    → «Sumar Precio Productos»: la suma de sus productos; se recalcula sola si cambian.
    //   'custom' → «Determinar Precio»: el precio que escriba la administración.
    comboPriceMode: {
        type: String,
        enum: { values: [ 'sum', 'custom' ], message: 'El modo de precio {VALUE} no es válido (sum o custom)' },
        default: 'custom'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        // Usuario del sistema que registró el producto
        ref: 'User',
        required: [true, 'El ID del usuario que registra es obligatorio']
    }
}, {
    timestamps: true,
    versionKey: false
});

const ProductModel = model( 'product', ProductSchema);

export default ProductModel;
