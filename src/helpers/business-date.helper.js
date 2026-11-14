/**
 * Fechas de negocio. Los indicadores se agrupan por "día de negocio" en la zona horaria del
 * local, no en UTC: una venta de las 8 p. m. en Bogotá ya es el día siguiente en UTC.
 * Un día se representa con su clave 'YYYY-MM-DD', que ordena igual como texto que como fecha.
 */
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/Bogota';

const DAY_MS = 86_400_000;
const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const NAIVE_DATETIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

// en-CA formatea como YYYY-MM-DD
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit'
});
const wallClockFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
});

const keyToUtc = (dayKey) => new Date(`${dayKey}T00:00:00Z`);
const utcToKey = (date) => date.toISOString().slice(0, 10);

// Día de negocio al que pertenece un instante
const toDayKey = (date = new Date()) => dayKeyFormatter.format(date);

const isValidDayKey = (value) => {
    if (typeof value !== 'string' || !DAY_KEY_REGEX.test(value)) return false;

    const date = keyToUtc(value);

    return !Number.isNaN(date.getTime()) && utcToKey(date) === value;
};

const addDays = (dayKey, days) => utcToKey(new Date(keyToUtc(dayKey).getTime() + days * DAY_MS));

// Desplaza meses/años ajustando al último día del mes destino (31 mar − 1 mes = 28/29 feb).
const shiftDayKey = (dayKey, { years = 0, months = 0 }) => {
    const [ year, month, day ] = dayKey.split('-').map(Number);
    const target = new Date(Date.UTC(year + years, month - 1 + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();

    target.setUTCDate(Math.min(day, lastDay));

    return utcToKey(target);
};

const startOfMonth = (dayKey) => `${dayKey.slice(0, 7)}-01`;
const startOfYear = (dayKey) => `${dayKey.slice(0, 4)}-01-01`;

// Cantidad de días de un rango, ambos extremos incluidos
const countDays = (from, to) => Math.round((keyToUtc(to) - keyToUtc(from)) / DAY_MS) + 1;

// Diferencia (ms) entre la hora local del negocio y UTC en un instante dado
const timezoneOffsetMs = (instant) => {
    const parts = Object.fromEntries(
        wallClockFormatter.formatToParts(new Date(instant))
            .filter((part) => part.type !== 'literal')
            .map((part) => [ part.type, Number(part.value) ])
    );

    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - instant;
};

/**
 * Setter de fechas de entrada. Un texto sin zona ("2026-11-12 13:00") se interpreta en la
 * hora del negocio; dejarlo a `new Date()` lo leería en la zona del servidor.
 * Cualquier otro valor (ISO con zona, Date, basura) se devuelve tal cual para que Mongoose lo convierta o lo rechace.
 */
const parseBusinessDate = (value) => {
    if (typeof value !== 'string') return value;

    const match = NAIVE_DATETIME_REGEX.exec(value.trim());
    if (!match) return value;

    // Los grupos de hora son opcionales: sin ellos se asume medianoche
    const [ year, month, day, hour, minute, second ] = match.slice(1).map((part) => Number(part ?? 0));
    const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);

    return new Date(asUtc - timezoneOffsetMs(asUtc));
};

export {
    BUSINESS_TIMEZONE,
    DAY_MS,
    keyToUtc,
    toDayKey,
    isValidDayKey,
    addDays,
    shiftDayKey,
    startOfMonth,
    startOfYear,
    countDays,
    parseBusinessDate
};
