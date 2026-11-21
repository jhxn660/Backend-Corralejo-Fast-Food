import asyncHandler from "../helpers/async-handler.helper.js";
import { HttpError } from "../helpers/http-error.helper.js";
import { countDays, isValidDayKey, startOfMonth, toDayKey } from "../helpers/business-date.helper.js";
import * as reports from "../services/indicators-reports.services.js";
import { dbRebuildIndicators, dbSetSalesGoal } from "../services/indicators.services.js";

const COMPARE_MODES = [ 'previous_period', 'previous_year', 'custom', 'none' ];
const GROUP_BY = [ 'day', 'month' ];
const MAX_RANGE_DAYS = 3660;    // 10 años
const MAX_DAILY_POINTS = 400;   // una serie diaria más larga se pide agrupada por mes
const MAX_TOP = 50;

/* ─────────────────────────── Lectura de parámetros ─────────────────────────── */

const readDay = (value, name, fallback) => {
    if (value === undefined || value === '') return fallback;

    if (!isValidDayKey(value)) {
        throw new HttpError(400, `El parámetro '${name}' debe ser una fecha válida con formato YYYY-MM-DD`);
    }

    return value;
};

const readRange = (from, to, [ fromName, toName ]) => {
    if (from > to) throw new HttpError(400, `'${fromName}' no puede ser posterior a '${toName}'`);

    if (countDays(from, to) > MAX_RANGE_DAYS) {
        throw new HttpError(400, `El rango no puede superar ${MAX_RANGE_DAYS} días`);
    }

    return { from, to };
};

const readOption = (value, allowed, name, fallback) => {
    if (value === undefined || value === '') return fallback;

    if (!allowed.includes(value)) {
        throw new HttpError(400, `El parámetro '${name}' solo admite: ${allowed.join(', ')}`);
    }

    return value;
};

// Día de referencia del dashboard (?date=YYYY-MM-DD); por defecto, hoy en la hora del negocio
const referenceDay = (req) => readDay(req.query.date, 'date', toDayKey());

const parseMetricsQuery = (query) => {
    const today = toDayKey();
    const to = readDay(query.to, 'to', today);
    const range = readRange(readDay(query.from, 'from', startOfMonth(to)), to, [ 'from', 'to' ]);
    const days = countDays(range.from, range.to);

    const compare = readOption(query.compare, COMPARE_MODES, 'compare', 'previous_period');
    const customRange = compare === 'custom'
        ? readRange(readDay(query.compareFrom, 'compareFrom'), readDay(query.compareTo, 'compareTo'), [ 'compareFrom', 'compareTo' ])
        : undefined;

    if (compare === 'custom' && (!customRange.from || !customRange.to)) {
        throw new HttpError(400, "Con compare=custom son obligatorios 'compareFrom' y 'compareTo'");
    }

    const groupBy = readOption(query.groupBy, GROUP_BY, 'groupBy', days > MAX_DAILY_POINTS ? 'month' : 'day');

    if (groupBy === 'day' && days > MAX_DAILY_POINTS) {
        throw new HttpError(400, `Para rangos de más de ${MAX_DAILY_POINTS} días usa groupBy=month`);
    }

    const top = query.top === undefined ? 5 : Number(query.top);

    if (!Number.isInteger(top) || top < 1 || top > MAX_TOP) {
        throw new HttpError(400, `El parámetro 'top' debe ser un entero entre 1 y ${MAX_TOP}`);
    }

    return { range, compare, customRange, groupBy, top };
};

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR_REGEX = /^\d{4}$/;

const readPattern = (value, regex, name, format, fallback) => {
    if (value === undefined || value === '') return fallback;

    if (typeof value !== 'string' || !regex.test(value)) {
        throw new HttpError(400, `El parámetro '${name}' debe tener el formato ${format}`);
    }

    return value;
};

const previousMonthOf = (monthKey) => {
    const [ year, month ] = monthKey.split('-').map(Number);

    return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
};

// Mismos valores por defecto que la vista: mes actual vs anterior, año del mes vs el anterior
const parsePanelQuery = (query, today) => {
    const readMonth = (name, fallback) => readPattern(query[name], MONTH_REGEX, name, 'YYYY-MM', fallback);
    const readYear = (name, fallback) => readPattern(query[name], YEAR_REGEX, name, 'YYYY', fallback);

    const month = readMonth('month', today.slice(0, 7));
    const compareA = readMonth('compareA', month);
    const compareB = readMonth('compareB', previousMonthOf(compareA));
    const yearA = readYear('yearA', month.slice(0, 4));
    const yearB = readYear('yearB', String(Number(yearA) - 1));

    return { month, compareA, compareB, yearA, yearB };
};

/* ──────────────────────────────── Handlers ──────────────────────────────── */

// Pantalla de Indicadores del Frontend actual, ya calculada
// ?month=YYYY-MM&compareA=YYYY-MM&compareB=YYYY-MM&yearA=YYYY&yearB=YYYY (todos opcionales)
const getPanel = asyncHandler(async (req, res) => {
    const today = toDayKey();

    res.json({ msg: 'Panel de indicadores', data: await reports.getPanel(parsePanelQuery(req.query, today), today) });
}, 'No se pudo armar el panel de indicadores');

// Vista completa de Indicadores en una sola petición (recomendado para el Frontend)
const getDashboard = asyncHandler(async (req, res) => {
    res.json({ msg: 'Indicadores del negocio', data: await reports.getDashboard(referenceDay(req)) });
}, 'No se pudieron obtener los indicadores');

/**
 * Una ruta por widget del dashboard. Conservan el contrato anterior (devuelven la sección
 * sin envoltorio) para no romper a quien ya las consume; cada una calcula solo lo suyo.
 */
const sendSection = (loadSections, section) => asyncHandler(async (req, res) => {
    const sections = await loadSections(referenceDay(req));

    res.json(sections[section]);
}, `No se pudo obtener la sección '${section}' de indicadores`);

const getKpis = sendSection(reports.getSalesOverview, 'kpis');
const getGoal = sendSection(reports.getSalesOverview, 'goal');
const getComparison = sendSection(reports.getSalesOverview, 'comparison');
const getProductRows = sendSection(reports.getProductIndicators, 'productRows');
const getRanking = sendSection(reports.getProductIndicators, 'ranking');
const getReviews = sendSection(reports.getReviews, 'reviews');

// Métricas numéricas de un rango con comparación entre períodos (para gráficas y reportes)
const getMetrics = asyncHandler(async (req, res) => {
    res.json({ msg: 'Métricas de ventas', data: await reports.getMetrics(parseMetricsQuery(req.query)) });
}, 'No se pudieron calcular las métricas');

const setGoal = asyncHandler(async (req, res) => {
    const year = Number(req.params.year);
    const { target } = req.body;

    if (!Number.isInteger(year)) {
        throw new HttpError(400, 'El año de la meta debe ser un número entero');
    }

    if (typeof target !== 'number' || !Number.isFinite(target)) {
        throw new HttpError(400, "El campo 'target' es obligatorio y debe ser numérico");
    }

    res.json({ msg: 'Meta anual registrada', data: await dbSetSalesGoal(year, target) });
}, 'No se pudo registrar la meta anual');

// Regenera el consolidado desde las ventas (carga del histórico o corrección de inconsistencias)
const rebuildIndicators = asyncHandler(async (req, res) => {
    res.json({ msg: 'Indicadores regenerados desde las ventas', data: await dbRebuildIndicators() });
}, 'No se pudieron regenerar los indicadores');

export {
    getPanel,
    getDashboard,
    getKpis,
    getGoal,
    getComparison,
    getProductRows,
    getRanking,
    getReviews,
    getMetrics,
    setGoal,
    rebuildIndicators
};
