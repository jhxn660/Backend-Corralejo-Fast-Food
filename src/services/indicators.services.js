import saleModel from "../models/sale.model.js";
import CommentModel from "../models/comment.model.js";
import dailyIndicatorModel from "../models/daily-indicator.model.js";
import salesGoalModel from "../models/sales-goal.model.js";
import { BUSINESS_TIMEZONE, DAY_MS, keyToUtc } from "../helpers/business-date.helper.js";
import { ONLY_ACTIVE } from "../helpers/visibility.helper.js";

/**
 * Capa de datos de Indicadores.
 *   Ventas (fuente de verdad) ──consolidar──▶ indicadores_diarios (un documento por día)
 * Las consultas del dashboard leen solo el consolidado: como mucho un documento por día
 * del rango, sin recorrer las ventas.
 */

const METRICS = [ 'revenue', 'salesCount', 'itemsSold' ];
const CANCELLED = 'Cancelado';

// Día de negocio de una venta, calculado por MongoDB en la zona horaria del local
const SALE_DAY = { $dateToString: { date: '$fecha', format: '%Y-%m-%d', timezone: BUSINESS_TIMEZONE } };

/* ───────────────────────────── Consolidación ───────────────────────────── */

/**
 * Recalcula el consolidado diario desde las ventas. Es idempotente (recalcula, no incrementa):
 * repetirlo deja el mismo resultado, sirve igual tras crear, editar o eliminar una venta, y
 * un fallo puntual se corrige solo en la siguiente consolidación del mismo día.
 *
 * @param {string[]} [dayKeys] - Días 'YYYY-MM-DD' a recalcular; sin argumento, todo el histórico
 * @returns {Promise<string[]>} Días que quedaron con ventas
 */
const dbConsolidateDays = async (dayKeys) => {
    const days = dayKeys && [ ...new Set(dayKeys) ].sort();

    if (days?.length === 0) return [];

    // Con días concretos se acota primero por el índice de `fecha` (±1 día cubre cualquier
    // zona horaria) y después se filtra por el día de negocio exacto.
    const fechaFilter = days
        ? { $gte: new Date(keyToUtc(days[0]).getTime() - DAY_MS), $lt: new Date(keyToUtc(days.at(-1)).getTime() + 2 * DAY_MS) }
        : { $type: 'date' };

    const salesByDay = [
        // Una venta cancelada no es ingreso: no cuenta en ningún indicador
        { $match: { fecha: fechaFilter, estadoPedido: { $ne: CANCELLED } } },
        { $project: { day: SALE_DAY, totalPagado: 1, detalles: 1, itemsSold: { $sum: '$detalles.cantidad' } } },
        ...(days ? [ { $match: { day: { $in: days } } } ] : [])
    ];

    const [ totals, products ] = await Promise.all([
        saleModel.aggregate([
            ...salesByDay,
            { $group: { _id: '$day', salesCount: { $sum: 1 }, revenue: { $sum: '$totalPagado' }, itemsSold: { $sum: '$itemsSold' } } }
        ]),
        saleModel.aggregate([
            ...salesByDay,
            { $unwind: '$detalles' },
            { $group: {
                _id: { day: '$day', name: '$detalles.producto' },
                quantity: { $sum: '$detalles.cantidad' },
                revenue: { $sum: '$detalles.subtotal' }
            } },
            { $sort: { quantity: -1, '_id.name': 1 } }
        ])
    ]);

    const productsByDay = new Map();
    for (const { _id, quantity, revenue } of products) {
        if (!productsByDay.has(_id.day)) productsByDay.set(_id.day, []);
        productsByDay.get(_id.day).push({ name: _id.name, quantity, revenue });
    }

    const documents = totals.map(({ _id: day, ...sums }) => ({ day, ...sums, products: productsByDay.get(day) ?? [] }));
    const consolidated = documents.map((document) => document.day);

    // Un día que se quedó sin ventas (se eliminaron o se movieron de fecha) deja de existir
    const staleDays = days ? { $in: days.filter((day) => !consolidated.includes(day)) } : { $nin: consolidated };

    await Promise.all([
        documents.length > 0 && dailyIndicatorModel.bulkWrite(documents.map((document) => ({
            updateOne: { filter: { day: document.day }, update: { $set: document }, upsert: true }
        }))),
        dailyIndicatorModel.deleteMany({ day: staleDays })
    ]);

    return consolidated;
};

/**
 * Las ventas registradas antes de este módulo guardaban `fecha` como texto ("2026-11-12 13:00").
 * Se convierte a Date interpretándola en la hora del negocio; si el texto no es legible se
 * usa la fecha de registro. Sin esto, esas ventas quedarían fuera de los indicadores.
 */
const dbNormalizeLegacySaleDates = async () => {
    const parsed = { $dateFromString: { dateString: '$fecha', timezone: BUSINESS_TIMEZONE, onError: null, onNull: null } };

    // Se usa el driver nativo: es una actualización por pipeline, que no pasa por el casteo de Mongoose
    const { modifiedCount } = await saleModel.collection.updateMany(
        { fecha: { $not: { $type: 'date' } } },
        [ { $set: { fecha: { $ifNull: [ parsed, { $ifNull: [ '$createdAt', '$$NOW' ] } ] } } } ]
    );

    return modifiedCount;
};

// Regenera todo el consolidado: carga inicial del histórico y recuperación ante inconsistencias.
const dbRebuildIndicators = async () => {
    const normalizedSales = await dbNormalizeLegacySaleDates();
    const days = await dbConsolidateDays();

    return { normalizedSales, consolidatedDays: days.length };
};

/* ─────────────────────── Consultas sobre el consolidado ─────────────────────── */

const inRange = ({ from, to }) => ({ $and: [ { $gte: [ '$day', from ] }, { $lte: [ '$day', to ] } ] });

// Rango mínimo que contiene a todos los rangos pedidos (las claves de día ordenan como texto)
const spanOf = (ranges) => {
    const list = Object.values(ranges);

    return {
        $gte: list.map((range) => range.from).sort()[0],
        $lte: list.map((range) => range.to).sort().at(-1)
    };
};

// Una suma condicional por rango y campo: N rangos se resuelven en una sola pasada
const conditionalSums = (ranges, fields, path = '') => Object.fromEntries(
    Object.entries(ranges).flatMap(([ name, range ]) => fields.map((field) => [
        `${name}_${field}`,
        { $sum: { $cond: [ inRange(range), `$${path}${field}`, 0 ] } }
    ]))
);

/**
 * Totales de varios rangos con nombre en UNA consulta.
 *
 * @param {Object<string, {from: string, to: string}>} ranges - p. ej. { month: {...}, previousMonth: {...} }
 * @returns {Promise<Object<string, {revenue: number, salesCount: number, itemsSold: number, averageTicket: number}>>}
 */
const dbGetTotalsByRanges = async (ranges) => {
    const [ row = {} ] = await dailyIndicatorModel.aggregate([
        { $match: { day: spanOf(ranges) } },
        { $group: { _id: null, ...conditionalSums(ranges, METRICS) } }
    ]);

    return Object.fromEntries(Object.keys(ranges).map((name) => {
        const [ revenue, salesCount, itemsSold ] = METRICS.map((metric) => row[`${name}_${metric}`] ?? 0);

        return [ name, { revenue, salesCount, itemsSold, averageTicket: salesCount ? Math.round(revenue / salesCount) : 0 } ];
    }));
};

/**
 * Unidades e ingreso por producto para varios rangos con nombre en UNA consulta.
 *
 * @returns {Promise<Array<{name: string} & Object<string, {quantity: number, revenue: number}>>>}
 */
const dbGetProductsByRanges = async (ranges) => {
    const rows = await dailyIndicatorModel.aggregate([
        { $match: { day: spanOf(ranges) } },
        { $unwind: '$products' },
        { $group: { _id: '$products.name', ...conditionalSums(ranges, [ 'quantity', 'revenue' ], 'products.') } }
    ]);

    return rows.map((row) => ({
        name: row._id,
        ...Object.fromEntries(Object.keys(ranges).map((name) => [
            name,
            { quantity: row[`${name}_quantity`], revenue: row[`${name}_revenue`] }
        ]))
    }));
};

// Serie temporal agrupada por día ('YYYY-MM-DD') o por mes ('YYYY-MM'); solo períodos con ventas
const dbGetSeries = async ({ from, to }, groupBy) => {
    const rows = await dailyIndicatorModel.aggregate([
        { $match: { day: { $gte: from, $lte: to } } },
        { $group: {
            _id: groupBy === 'month' ? { $substrBytes: [ '$day', 0, 7 ] } : '$day',
            revenue: { $sum: '$revenue' },
            salesCount: { $sum: '$salesCount' },
            itemsSold: { $sum: '$itemsSold' }
        } },
        { $sort: { _id: 1 } }
    ]);

    return rows.map(({ _id: period, ...sums }) => ({ period, ...sums }));
};

/**
 * Productos mejor valorados. La calificación es del ticket, así que se atribuye a cada
 * producto distinto de esa venta. Solo cuentan los comentarios visibles (isActive).
 */
const dbGetProductReviews = async (limit) => {
    return await CommentModel.aggregate([
        { $match: { ...ONLY_ACTIVE, calificacion: { $gte: 1 } } },
        { $lookup: { from: saleModel.collection.name, localField: 'venta', foreignField: '_id', as: 'sale' } },
        { $unwind: '$sale' },
        { $project: { calificacion: 1, product: { $setUnion: [ '$sale.detalles.producto' ] } } },
        { $unwind: '$product' },
        { $group: { _id: '$product', count: { $sum: 1 }, score: { $avg: '$calificacion' } } },
        { $sort: { score: -1, count: -1, _id: 1 } },
        { $limit: limit },
        { $project: { _id: 0, name: '$_id', count: 1, score: { $round: [ '$score', 1 ] } } }
    ]);
};

// Meses ('YYYY-MM') que tienen ventas, del más reciente al más antiguo
const dbGetMonthsWithSales = async () => {
    const rows = await dailyIndicatorModel.aggregate([
        { $group: { _id: { $substrBytes: [ '$day', 0, 7 ] } } },
        { $sort: { _id: -1 } }
    ]);

    return rows.map((row) => row._id);
};

/* ──────────────────────────────── Meta anual ──────────────────────────────── */

const dbGetSalesGoal = async (year) => {
    return await salesGoalModel.findOne({ year });
};

const dbSetSalesGoal = async (year, target) => {
    return await salesGoalModel.findOneAndUpdate(
        { year },
        { year, target },
        { returnDocument: 'after', upsert: true, runValidators: true }
    );
};

export {
    dbConsolidateDays,
    dbRebuildIndicators,
    dbGetTotalsByRanges,
    dbGetProductsByRanges,
    dbGetSeries,
    dbGetProductReviews,
    dbGetMonthsWithSales,
    dbGetSalesGoal,
    dbSetSalesGoal
};
