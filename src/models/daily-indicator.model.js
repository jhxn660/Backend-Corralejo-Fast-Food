import { Schema, model } from 'mongoose';

const productTotalSchema = new Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    revenue: { type: Number, required: true }
}, { _id: false });

/**
 * Consolidado de ventas de un día de negocio. Es un dato DERIVADO: se recalcula desde la
 * colección de ventas cada vez que una venta de ese día se registra, edita o elimina, y
 * puede regenerarse completo con POST /api/indicators/rebuild. Nunca se edita a mano.
 * Guarda números, no textos formateados: el formato es asunto de la respuesta, no del dato.
 */
const dailyIndicatorSchema = new Schema({
    // 'YYYY-MM-DD' en la zona horaria del negocio. Ordena igual como texto que como fecha,
    // así los rangos se resuelven con $gte/$lte sobre este índice único.
    day: { type: String, required: true, unique: true },
    salesCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    itemsSold: { type: Number, default: 0 },
    products: { type: [productTotalSchema], default: [] }
}, { timestamps: true, versionKey: false });

const dailyIndicatorModel = model('DailyIndicator', dailyIndicatorSchema, 'indicadores_diarios');

export default dailyIndicatorModel;
