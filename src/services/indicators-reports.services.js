import { addDays, countDays, shiftDayKey, startOfMonth, startOfYear } from '../helpers/business-date.helper.js';
import { toComparison, toGoal, toKpis, toMetrics, toPanel, toProductIndicators, toReviews } from '../dtos/indicators.dto.js';

import {
    dbGetMonthsWithSales,
    dbGetProductReviews,
    dbGetProductsByRanges,
    dbGetSalesGoal,
    dbGetSeries,
    dbGetTotalsByRanges
} from './indicators.services.js';

/**
 * Casos de uso de Indicadores: deciden qué rangos se comparan, piden los totales a la capa
 * de datos y delegan la forma de la respuesta en los DTO.
 */

const PRODUCT_ROWS_LIMIT = 10;
const RANKING_LIMIT = 5;
const REVIEWS_LIMIT = 5;

/**
 * Rangos del dashboard para un día de referencia. Las comparaciones son "a la fecha": el
 * período en curso contra el MISMO tramo del anterior (1–13 nov vs 1–13 oct). Comparar un mes
 * a medias contra el mes anterior completo mostraría siempre una caída que no existe.
 */
const buildDashboardRanges = (day) => {
    const lastMonth = shiftDayKey(day, { months: -1 });
    const lastYear = shiftDayKey(day, { years: -1 });

    return {
        month: { from: startOfMonth(day), to: day },
        previousMonth: { from: startOfMonth(lastMonth), to: lastMonth },
        year: { from: startOfYear(day), to: day },
        previousYear: { from: startOfYear(lastYear), to: lastYear },
        monthLastYear: { from: startOfMonth(lastYear), to: lastYear }
    };
};

// Secciones: KPIs, meta anual y comparación de ventas (2 consultas)
const getSalesOverview = async (day) => {
    const ranges = buildDashboardRanges(day);
    const year = Number(day.slice(0, 4));

    const [ totals, goal ] = await Promise.all([ dbGetTotalsByRanges(ranges), dbGetSalesGoal(year) ]);

    return {
        kpis: toKpis(totals),
        goal: toGoal(goal, totals.year.revenue, year),
        comparison: toComparison(totals, ranges)
    };
};

// Secciones: indicadores por producto y ranking (1 consulta)
const getProductIndicators = async (day) => {
    const { month, year } = buildDashboardRanges(day);
    const products = await dbGetProductsByRanges({ month, year });

    return toProductIndicators(products, { rowsLimit: PRODUCT_ROWS_LIMIT, rankingLimit: RANKING_LIMIT });
};

// Sección: productos mejor valorados (1 consulta)
const getReviews = async () => {
    return { reviews: toReviews(await dbGetProductReviews(REVIEWS_LIMIT)) };
};

// Vista completa de Indicadores en una sola petición
const getDashboard = async (day) => {
    const sections = await Promise.all([ getSalesOverview(day), getProductIndicators(day), getReviews() ]);

    return { date: day, ...Object.assign({}, ...sections) };
};

const monthRange = (monthKey) => {
    const from = `${monthKey}-01`;

    return { from, to: addDays(shiftDayKey(from, { months: 1 }), -1) };
};

const yearRange = (year) => ({ from: `${year}-01-01`, to: `${year}-12-31` });

const previousMonthKey = (monthKey) => shiftDayKey(`${monthKey}-01`, { months: -1 }).slice(0, 7);

/**
 * Panel de Indicadores de la vista actual del Frontend.
 *
 * @param {Object} selection
 * @param {string} selection.month - Mes analizado 'YYYY-MM'
 * @param {string} selection.compareA - Primer mes de "Comparar meses"
 * @param {string} selection.compareB - Segundo mes de "Comparar meses"
 * @param {string} selection.yearA - Primer año de la comparativa histórica
 * @param {string} selection.yearB - Segundo año de la comparativa histórica
 * @param {string} today - Día de negocio actual, para las opciones de los selectores
 */
const getPanel = async (selection, today) => {
    const ranges = {
        month: monthRange(selection.month),
        previousMonth: monthRange(previousMonthKey(selection.month)),
        compareA: monthRange(selection.compareA),
        compareB: monthRange(selection.compareB),
        year: yearRange(selection.month.slice(0, 4))
    };

    // Ocho consultas en paralelo sobre el consolidado diario (como mucho un documento por día)
    const [ totals, products, daily, seriesA, seriesB, goal, reviews, monthsWithSales ] = await Promise.all([
        dbGetTotalsByRanges(ranges),
        dbGetProductsByRanges({ month: ranges.month, year: ranges.year }),
        dbGetSeries(ranges.month, 'day'),
        dbGetSeries(yearRange(selection.yearA), 'month'),
        dbGetSeries(yearRange(selection.yearB), 'month'),
        dbGetSalesGoal(Number(selection.month.slice(0, 4))),
        dbGetProductReviews(REVIEWS_LIMIT),
        dbGetMonthsWithSales()
    ]);

    return toPanel({
        selection,
        ranges,
        today,
        totals,
        products,
        daily,
        yearSeries: { [selection.yearA]: seriesA, [selection.yearB]: seriesB },
        goal,
        reviews,
        monthsWithSales
    });
};

// Período contra el que se compara un rango
const resolveComparisonRange = ({ from, to }, mode) => {
    if (mode === 'previous_year') {
        return { from: shiftDayKey(from, { years: -1 }), to: shiftDayKey(to, { years: -1 }) };
    }

    // previous_period: el tramo de igual duración inmediatamente anterior
    const previousTo = addDays(from, -1);

    return { from: addDays(previousTo, 1 - countDays(from, to)), to: previousTo };
};

/**
 * Métricas de un rango de fechas arbitrario, con comparación opcional entre períodos.
 *
 * @param {Object} params
 * @param {{from: string, to: string}} params.range
 * @param {'previous_period'|'previous_year'|'custom'|'none'} params.compare
 * @param {{from: string, to: string}} [params.customRange] - Solo con compare 'custom'
 * @param {'day'|'month'} params.groupBy
 * @param {number} params.top - Cantidad de productos del ranking
 */
const getMetrics = async ({ range, compare, customRange, groupBy, top }) => {
    const comparison = compare === 'none'
        ? null
        : { mode: compare, range: customRange ?? resolveComparisonRange(range, compare) };
    const ranges = comparison ? { current: range, previous: comparison.range } : { current: range };

    const [ totals, products, series ] = await Promise.all([
        dbGetTotalsByRanges(ranges),
        dbGetProductsByRanges({ current: range }),
        dbGetSeries(range, groupBy)
    ]);

    return toMetrics({ range, comparison, groupBy, top, totals, products, series });
};

export {
    getSalesOverview,
    getProductIndicators,
    getReviews,
    getDashboard,
    getPanel,
    getMetrics
};
