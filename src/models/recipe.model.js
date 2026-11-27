import { Schema, model } from 'mongoose';

/**
 * RECETA de un producto: qué insumos gasta UNA unidad del producto y cuánto de cada uno.
 *   - `quantity` está en la unidad de medida del insumo (su campo `medida`: kg, L, u…).
 *   - Un producto tiene como máximo una receta (`product` es único).
 *   - Un combo no tiene receta propia: gasta las recetas de los productos que agrupa.
 * Al registrar una venta se descuentan del inventario los insumos de sus recetas
 * (ver dbDiscountSaleSupplies en recipes.services.js).
 */
const RecipeItemSchema = new Schema({
    supply: {
        type: Schema.Types.ObjectId,
        ref: 'Supply',
        required: [true, 'Cada línea de la receta necesita su insumo']
    },
    quantity: {
        type: Number,
        required: [true, 'Cada línea de la receta necesita su cantidad'],
        validate: {
            validator: (value) => value > 0,
            message: 'La cantidad de cada insumo debe ser mayor que 0'
        }
    }
}, { _id: false });

const RecipeSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'product',
        required: [true, 'El producto de la receta es obligatorio'],
        unique: true,
        // La receta es de ESE producto: para otro producto se crea otra receta
        immutable: true
    },
    items: {
        type: [RecipeItemSchema],
        validate: [
            {
                validator: (items) => items.length > 0,
                message: 'La receta necesita al menos un insumo'
            },
            {
                validator: (items) => new Set(items.map((item) => String(item.supply))).size === items.length,
                message: 'Un insumo no puede repetirse en la misma receta'
            }
        ]
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario que registra la receta es obligatorio']
    }
}, {
    timestamps: true,
    versionKey: false
});

const RecipeModel = model('Recipe', RecipeSchema, 'recetas');

export default RecipeModel;
