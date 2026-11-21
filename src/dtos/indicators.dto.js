import { addDays, countDays, keyToUtc, shiftDayKey } from "../helpers/business-date.helper.js";

/**
 * Presentación de Indicadores: funciones puras que convierten los totales numéricos en los
 * objetos que consume el Frontend. Aquí no hay consultas ni reglas de acceso.
 * Cada texto formateado viaja junto a su valor numérico (`raw`, `target`, ...), de modo que
 * la vista puede pintarlo directo o graficarlo sin tener que deshacer el formato.
 */

const LOCALE = 'es-CO';
const RANKING_TONES = [ 'gold', 'silver', 'bronze' ];
const TREND_SYMBOL = { up: '▲', down: '▼', flat: '=' };

const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0, useGrouping: 'always' });
const longMonthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long', timeZone: 'UTC' });
const shortMonthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'short', timeZone: 'UTC' });

const formatNumber = (value) => numberFormatter.format(value);
const formatMoney = (value) => `$${formatNumber(value)}`;
const roundTo1 = (value) => Math.round(value * 10) / 10;
const toPercent = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

// "Noviembre 2026"
const formatMonthLabel = (dayKey) => {
    const month = longMonthFormatter.format(keyToUtc(dayKey));

    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${dayKey.slice(0, 4)}`;
};

// "nov. 2025"
const formatShortMonthLabel = (dayKey) => {
    return `${shortMonthFormatter.format(keyToUtc(dayKey)).replace(/\.$/, '')}. ${dayKey.slice(0, 4)}`;
};

/**
 * Variación entre dos valores. `percent` es null cuando el valor anterior es 0:
 * no hay base de comparación y no se inventa un porcentaje.
 */
const computeVariation = (current, previous) => {
    const absolute = current - previous;

    return {
        absolute,
        percent: previous > 0 ? roundTo1((absolute / previous) * 100) : null,
        trend: absolute > 0 ? 'up' : absolute < 0 ? 'down' : 'flat'
    };
};

// "▲ 8.4%"
const formatDiff = ({ percent, trend }) => (percent === null ? '—' : `${TREND_SYMBOL[trend]} ${Math.abs(percent)}%`);

// "▲ 8.4% vs mes anterior"
const formatTrend = (variation, versus) => {
    return variation.percent === null ? `Sin datos: ${versus}` : `${formatDiff(variation)} vs ${versus}`;
};

// Porcentajes enteros que suman exactamente 100 (método del mayor resto): alimentan una gráfica de torta
const toSharesOf100 = (values) => {
    const total = values.reduce((sum, value) => sum + value, 0);

    if (total <= 0) return values.map(() => 0);

    const exact = values.map((value) => (value / total) * 100);
    const shares = exact.map(Math.floor);
    const byRemainder = exact.map((value, index) => ({ index, remainder: value - shares[index] }))
        .sort((a, b) => b.remainder - a.remainder);
    const missing = 100 - shares.reduce((sum, share) => sum + share, 0);

    byRemainder.slice(0, missing).forEach(({ index }) => { shares[index] += 1; });

    return shares;
};

const describeRange = ({ from, to }) => ({ from, to, days: countDays(from, to) });

/* ───────────────────────────── Dashboard (vista) ───────────────────────────── */

const toKpi = ({ id, variant, icon, label, current, previous, versus, format }) => {
    const variation = computeVariation(current, previous);

    return {
        id, variant, icon, label,
        value: format(current),
        trend: formatTrend(variation, versus),
        raw: { value: current, previous, ...variation }
    };
};

const toKpis = (totals) => [
    toKpi({
        id: 'k1', variant: 'sales', icon: '💰', label: 'Ventas del Mes', format: formatMoney,
        current: totals.month.revenue, previous: totals.previousMonth.revenue, versus: 'mes anterior'
    }),
    toKpi({
        id: 'k2', variant: 'year', icon: '📊', label: 'Ventas del Año', format: formatMoney,
        current: totals.year.revenue, previous: totals.previousYear.revenue, versus: 'año anterior'
    }),
    toKpi({
        id: 'k3', variant: 'products', icon: '🍔', label: 'Productos Vendidos', format: formatNumber,
        current: totals.month.itemsSold, previous: totals.previousMonth.itemsSold, versus: 'mes anterior'
    })
];

// Sin meta definida para el año los campos de la meta van en null: la vista muestra el hueco
const toGoal = (goal, achieved, year) => {
    const target = goal?.target ?? null;

    return {
        label: 'Meta Anual de Ventas',
        value: target && formatMoney(target),
        progressPercent: target ? Math.min(roundTo1((achieved / target) * 100), 100) : 0,
        remaining: target && formatMoney(Math.max(target - achieved, 0)),
        year,
        target,
        achieved
    };
};

const formatYearlyNote = ({ absolute }) => {
    if (absolute === 0) return 'Igual que el año anterior';

    return `${formatMoney(Math.abs(absolute))} ${absolute > 0 ? 'más' : 'menos'} que el año anterior`;
};

const toComparison = (totals, ranges) => {
    const yearly = computeVariation(totals.year.revenue, totals.previousYear.revenue);
    const monthly = computeVariation(totals.month.revenue, totals.monthLastYear.revenue);
    const toSide = (range, sums) => ({
        year: range.to.slice(0, 4),
        sales: formatMoney(sums.revenue),
        products: formatNumber(sums.itemsSold),
        range,
        raw: sums
    });

    return {
        previous: toSide(ranges.previousYear, totals.previousYear),
        current: toSide(ranges.year, totals.year),
        yearlyDiff: formatDiff(yearly),
        yearlyNote: formatYearlyNote(yearly),
        monthly: {
            label: formatMonthLabel(ranges.month.to),
            value: formatMoney(totals.month.revenue),
            diff: formatTrend(monthly, formatShortMonthLabel(ranges.monthLastYear.to))
        },
        raw: { yearly, monthly }
    };
};

// Orden descendente por los criterios dados, en orden; el empate final se resuelve por nombre
const byDescending = (...picks) => (a, b) => {
    for (const pick of picks) {
        const difference = pick(b) - pick(a);

        if (difference !== 0) return difference;
    }

    return a.name.localeCompare(b.name);
};

/**
 * @param {Array<{name: string, month: {quantity, revenue}, year: {quantity, revenue}}>} products
 * @returns {{productRows: Array, ranking: Array}}
 *   - productRows: `pct` = participación en el ingreso total del período (todos los productos).
 *   - ranking: más vendidos del año; `pct` = participación en unidades DENTRO del ranking,
 *     para que la torta que lo dibuja sume 100.
 */
const toProductIndicators = (products, { rowsLimit, rankingLimit }) => {
    const totalRevenue = (range) => products.reduce((sum, product) => sum + product[range].revenue, 0);
    const revenueTotals = { month: totalRevenue('month'), year: totalRevenue('year') };

    const toCell = (product, range) => ({
        qty: formatNumber(product[range].quantity),
        revenue: formatMoney(product[range].revenue),
        pct: toPercent(product[range].revenue, revenueTotals[range]),
        raw: product[range]
    });

    const productRows = [ ...products ]
        .sort(byDescending((product) => product.year.revenue, (product) => product.year.quantity))
        .slice(0, rowsLimit)
        .map((product, index) => ({
            id: index + 1,
            name: product.name,
            monthly: toCell(product, 'month'),
            annual: toCell(product, 'year')
        }));

    const top = [ ...products ]
        .filter((product) => product.year.quantity > 0)
        .sort(byDescending((product) => product.year.quantity, (product) => product.year.revenue))
        .slice(0, rankingLimit);
    const shares = toSharesOf100(top.map((product) => product.year.quantity));

    const ranking = top.map((product, index) => ({
        id: index + 1,
        pos: index + 1,
        tone: RANKING_TONES[index] ?? 'plain',
        name: product.name,
        qty: formatNumber(product.year.quantity),
        revenue: formatMoney(product.year.revenue),
        pct: shares[index],
        raw: product.year
    }));

    return { productRows, ranking };
};

const toReviews = (reviews) => reviews.map((review, index) => ({ id: index + 1, ...review }));

/* ──────────────────────── Métricas por rango (numéricas) ──────────────────────── */

// Completa los períodos sin ventas con ceros: la gráfica recibe una serie continua
const fillSeries = ({ from, to }, groupBy, rows) => {
    const byPeriod = new Map(rows.map((row) => [ row.period, row ]));
    const isMonthly = groupBy === 'month';
    const lastPeriod = isMonthly ? to.slice(0, 7) : to;
    const points = [];

    for (let cursor = isMonthly ? `${from.slice(0, 7)}-01` : from; ; ) {
        const period = isMonthly ? cursor.slice(0, 7) : cursor;

        if (period > lastPeriod) break;

        points.push(byPeriod.get(period) ?? { period, revenue: 0, salesCount: 0, itemsSold: 0 });
        cursor = isMonthly ? shiftDayKey(cursor, { months: 1 }) : addDays(cursor, 1);
    }

    return points;
};

const toTopProducts = (products, limit) => {
    const totalOf = (field) => products.reduce((sum, product) => sum + product.current[field], 0);
    const totals = { quantity: totalOf('quantity'), revenue: totalOf('revenue') };
    const toShare = (value, total) => (total > 0 ? roundTo1((value / total) * 100) : 0);

    return [ ...products ]
        .sort(byDescending((product) => product.current.quantity, (product) => product.current.revenue))
        .slice(0, limit)
        .map((product, index) => ({
            position: index + 1,
            name: product.name,
            quantity: product.current.quantity,
            revenue: product.current.revenue,
            quantityShare: toShare(product.current.quantity, totals.quantity),
            revenueShare: toShare(product.current.revenue, totals.revenue)
        }));
};

const toMetrics = ({ range, comparison, groupBy, top, totals, products, series }) => ({
    range: describeRange(range),
    totals: totals.current,
    comparison: comparison && {
        mode: comparison.mode,
        range: describeRange(comparison.range),
        totals: totals.previous,
        variation: Object.fromEntries(
            Object.keys(totals.current).map((metric) => [ metric, computeVariation(totals.current[metric], totals.previous[metric]) ])
        )
    },
    series: { groupBy, points: fillSeries(range, groupBy, series) },
    topProducts: toTopProducts(products, top)
});

/* ─────────────── Panel de Indicadores (vista actual del Frontend) ─────────────── */

const toShareOf = (value, total) => (total > 0 ? roundTo1((value / total) * 100) : 0);

const variationOf = (current, previous) => Object.fromEntries(
    Object.keys(current).map((metric) => [ metric, computeVariation(current[metric], previous[metric]) ])
);

const toMonth = (key) => ({ key, label: formatMonthLabel(`${key}-01`) });

const goalProgress = (achieved, target) => (target ? Math.min(100, roundTo1((achieved / target) * 100)) : 0);

/**
 * Todo lo que pinta la pantalla de Indicadores, ya calculado: el Frontend solo formatea.
 * Los meses se comparan COMPLETOS (calendario), igual que en la vista. Importes en enteros COP,
 * porcentajes con un decimal y `percent: null` cuando no hay base de comparación.
 */
const toPanel = ({ selection, ranges, today, totals, products, daily, yearSeries, goal, reviews, monthsWithSales }) => {
    const target = goal?.target ?? null;
    const achieved = totals.year.revenue;
    const currentYear = Number(today.slice(0, 4));

    const months = [ ...new Set([ today.slice(0, 7), ...monthsWithSales ]) ].sort().reverse();
    const years = [ ...new Set([ String(currentYear), String(currentYear - 1), ...monthsWithSales.map((key) => key.slice(0, 4)) ]) ]
        .sort()
        .reverse();

    const toYearSide = (year) => {
        const points = fillSeries({ from: `${year}-01-01`, to: `${year}-12-31` }, 'month', yearSeries[year]);
        const total = points.reduce((sum, point) => sum + point.revenue, 0);

        return { year, total, months: points.map((point) => point.revenue), goalProgress: goalProgress(total, target) };
    };
    const yearA = toYearSide(selection.yearA);
    const yearB = toYearSide(selection.yearB);

    const sumOf = (range, field) => products.reduce((sum, product) => sum + product[range][field], 0);
    const productTotals = { monthRevenue: sumOf('month', 'revenue'), yearRevenue: sumOf('year', 'revenue'), yearUnits: sumOf('year', 'quantity') };
    const soldThisYear = products.filter((product) => product.year.quantity > 0);

    return {
        month: toMonth(selection.month),
        year: selection.month.slice(0, 4),
        options: { months: months.map(toMonth), years },

        summary: {
            current: totals.month,
            previous: totals.previousMonth,
            previousMonth: toMonth(ranges.previousMonth.from.slice(0, 7)),
            variation: variationOf(totals.month, totals.previousMonth)
        },

        goal: {
            year: Number(selection.month.slice(0, 4)),
            target,
            achieved,
            progressPercent: goalProgress(achieved, target),
            remaining: target === null ? null : Math.max(target - achieved, 0),
            reached: target !== null && achieved >= target
        },

        monthComparison: {
            a: { ...toMonth(selection.compareA), totals: totals.compareA },
            b: { ...toMonth(selection.compareB), totals: totals.compareB },
            variation: variationOf(totals.compareA, totals.compareB)
        },

        yearComparison: {
            a: yearA,
            b: yearB,
            variation: computeVariation(yearA.total, yearB.total)
        },

        daily: fillSeries(ranges.month, 'day', daily).map(({ period, revenue, salesCount }) => ({
            day: Number(period.slice(8, 10)),
            date: period,
            revenue,
            salesCount
        })),

        // Ordenados por ingreso anual: el mensual oscila demasiado los primeros días del mes
        products: [ ...soldThisYear ]
            .sort(byDescending((product) => product.year.revenue, (product) => product.year.quantity))
            .slice(0, 10)
            .map((product) => ({
                name: product.name,
                month: { ...product.month, share: toShareOf(product.month.revenue, productTotals.monthRevenue) },
                year: { ...product.year, share: toShareOf(product.year.revenue, productTotals.yearRevenue) }
            })),

        // Más vendidos del año por unidades; `share` es sobre TODAS las unidades del año
        // (la torta deja en gris lo que no entra en el top)
        ranking: [ ...soldThisYear ]
            .sort(byDescending((product) => product.year.quantity, (product) => product.year.revenue))
            .slice(0, 5)
            .map((product, index) => ({
                position: index + 1,
                name: product.name,
                quantity: product.year.quantity,
                revenue: product.year.revenue,
                share: toShareOf(product.year.quantity, productTotals.yearUnits)
            })),

        ratings: reviews
    };
};

export {
    toPanel,
    toKpis,
    toGoal,
    toComparison,
    toProductIndicators,
    toReviews,
    toMetrics
};
