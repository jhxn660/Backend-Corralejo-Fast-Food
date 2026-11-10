import indicatorModel from "../models/indicator.model.js";

// El dashboard persiste sus cifras ya formateadas para mostrar ("$12.000"), así que
// toda operación aritmética pasa por estos conversores de ida y vuelta (locale es-CO).
const parseNum = (str) => parseInt(str.replace(/[^0-9]/g, ''), 10);
const formatNum = (num) => new Intl.NumberFormat('es-CO').format(num);
const formatMoney = (num) => '$' + formatNum(num);

const dbCreateIndicators = async (newIndicators) => {
    return await indicatorModel.create(newIndicators);
};

// Solo el reporte más reciente se considera vigente; los anteriores quedan como histórico.
const dbReadLatestIndicators = async () => {
    return await indicatorModel.findOne().sort({ createdAt: -1 });
};

/**
 * Acumula una venta recién registrada sobre el reporte vigente, de modo que el
 * dashboard refleje las cifras en tiempo real sin recalcular todo el histórico.
 * Si todavía no existe ningún reporte, la venta se registra igual y no se actualiza nada.
 */
const dbUpdateIndicatorsOnSale = async (newSale) => {
    const indicator = await dbReadLatestIndicators();
    if (!indicator) return;

    const saleTotal = newSale.totalPagado;
    const totalProductos = newSale.detalles.reduce((acc, item) => acc + item.cantidad, 0);

    // 1. KPIs principales: k1 = ventas del mes, k2 = ventas del año, k3 = productos vendidos
    indicator.kpis.forEach((kpi) => {
        if (kpi.id === 'k1' || kpi.id === 'k2') {
            kpi.value = formatMoney(parseNum(kpi.value) + saleTotal);
        }

        if (kpi.id === 'k3') {
            kpi.value = formatNum(parseNum(kpi.value) + totalProductos);
        }
    });

    // 2. Meta anual: se lee k2 después del paso anterior para incluir la venta actual
    const metaAnual = parseNum(indicator.goal.value);
    const currentYearSales = parseNum(indicator.kpis.find((k) => k.id === 'k2').value);
    const faltante = metaAnual - currentYearSales;

    indicator.goal.remaining = formatMoney(faltante > 0 ? faltante : 0);
    indicator.goal.progressPercent = parseFloat(((currentYearSales / metaAnual) * 100).toFixed(1));

    // 3. Panel de comparación de ventas
    indicator.comparison.current.sales = formatMoney(parseNum(indicator.comparison.current.sales) + saleTotal);
    indicator.comparison.current.products = formatNum(parseNum(indicator.comparison.current.products) + totalProductos);
    indicator.comparison.monthly.value = formatMoney(parseNum(indicator.comparison.monthly.value) + saleTotal);

    await indicator.save();
};

export {
    dbCreateIndicators,
    dbReadLatestIndicators,
    dbUpdateIndicatorsOnSale
};
