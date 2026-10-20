import { Schema, model } from "mongoose";

// Subesquemas para mantener el orden
const kpiSchema = new Schema({
    id: String,
    variant: String,
    icon: String,
    label: String,
    value: String,
    trend: String
}, { _id: false });

const goalSchema = new Schema({
    label: String,
    value: String,
    progressPercent: Number,
    remaining: String
}, { _id: false });

const comparisonSchema = new Schema({
    previous: { year: String, sales: String, products: String },
    current: { year: String, sales: String, products: String },
    yearlyDiff: String,
    yearlyNote: String,
    monthly: { label: String, value: String, diff: String }
}, { _id: false });

const productRowSchema = new Schema({
    id: String,
    name: String,
    monthly: { qty: String, revenue: String, pct: Number },
    annual: { qty: String, revenue: String, pct: Number }
}, { _id: false });

const rankingSchema = new Schema({
    id: String,
    pos: Number,
    tone: String,
    name: String,
    pct: Number,
    qty: String,
    revenue: String
}, { _id: false });

const reviewSchema = new Schema({
    id: String,
    name: String,
    count: Number,
    score: Number
}, { _id: false });

// Esquema Principal de Indicadores
const indicadoresSchema = new Schema({
    periodo: { 
        type: String, 
        required: true, 
        unique: true // Ej: "2026-10" para que solo haya un reporte por mes
    },
    kpis: [kpiSchema],
    goal: goalSchema,
    comparison: comparisonSchema,
    productRows: [productRowSchema],
    ranking: [rankingSchema],
    reviews: [reviewSchema]
}, {
    timestamps: true
});

// El tercer parámetro fuerza el nombre exacto de la colección en la base de datos
const indicadoresModel = model('Indicador', indicadoresSchema, 'indicadores');
export default indicadoresModel;