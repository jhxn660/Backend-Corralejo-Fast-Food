import { Schema, model } from "mongoose";

const kpiSchema = new Schema({
    id: { type: String, required: [true, 'El ID del KPI es obligatorio.'] },
    variant: { type: String, required: [true, 'El estilo o variante del KPI es obligatorio.'] },
    icon: { type: String, required: [true, 'Debes asignar un icono al KPI.'] },
    label: { type: String, required: [true, 'El título (label) del KPI es obligatorio.'] },
    value: { type: String, required: [true, 'El valor del KPI no puede estar vacío.'] },
    trend: { type: String, required: [true, 'Debes incluir la tendencia (trend) del KPI.'] }
}, { _id: false });

const goalSchema = new Schema({
    label: { type: String, required: [true, 'El título de la meta es obligatorio.'] },
    value: { type: String, required: [true, 'El valor de la meta es obligatorio.'] },
    progressPercent: { 
        type: Number, 
        required: [true, 'El porcentaje de progreso es obligatorio.'],
        min: [0, 'El progreso no puede ser menor al 0%.'],
        max: [100, 'El progreso no puede sobrepasar el 100% de cumplimiento.']
    },
    remaining: { type: String, required: [true, 'Debes indicar el valor restante de la meta.'] }
}, { _id: false });

const comparisonSchema = new Schema({
    previous: { type: Object, required: [true, 'Los datos del año anterior son obligatorios.'] },
    current: { type: Object, required: [true, 'Los datos del año actual son obligatorios.'] },
    yearlyDiff: { type: String, required: [true, 'La diferencia anual calculada es requerida.'] },
    yearlyNote: { type: String, required: [true, 'La nota descriptiva anual es requerida.'] },
    monthly: { type: Object, required: [true, 'Los datos mensuales son obligatorios.'] }
}, { _id: false });

// Esquema Principal de Indicadores
const indicadoresSchema = new Schema({
    periodo: { 
        type: String, 
        required: [true, 'El periodo (ej. 2026-10) es obligatorio para crear el registro de indicadores.'], 
        unique: true 
    },
    kpis: {
        type: [kpiSchema],
        validate: {
            validator: function(arreglo) { return arreglo != null && arreglo.length > 0; },
            message: 'El dashboard no puede renderizarse sin KPIs. Debes agregar al menos 1 KPI.'
        }
    },
    goal: { 
        type: goalSchema, 
        required: [true, 'El panel de metas (goal) es obligatorio para construir el reporte.'] 
    },
    comparison: { 
        type: comparisonSchema, 
        required: [true, 'El panel de comparación de ventas es obligatorio.'] 
    },
    productRows: { type: Array, required: [true, 'La tabla de productos es obligatoria.'] },
    ranking: { type: Array, required: [true, 'El top/ranking de productos es obligatorio.'] },
    reviews: { type: Array, required: [true, 'Las calificaciones (reviews) son obligatorias.'] }
}, {
    timestamps: true
});

const indicadoresModel = model('Indicador', indicadoresSchema, 'indicadores');
export default indicadoresModel;