import { Schema, model } from "mongoose";

// Meta anual de ventas. El avance no se guarda: se calcula contra las ventas del año.
const salesGoalSchema = new Schema({
    year: {
        type: Number,
        required: [true, 'El año de la meta es obligatorio.'],
        unique: true,
        min: [2000, 'El año de la meta no es válido.'],
        max: [2100, 'El año de la meta no es válido.'],
        validate: { validator: Number.isInteger, message: 'El año de la meta debe ser un número entero.' }
    },
    target: {
        type: Number,
        required: [true, 'El valor de la meta es obligatorio.'],
        min: [1, 'La meta debe ser mayor que cero.']
    }
}, { timestamps: true, versionKey: false });

const salesGoalModel = model('SalesGoal', salesGoalSchema, 'metas_ventas');

export default salesGoalModel;
