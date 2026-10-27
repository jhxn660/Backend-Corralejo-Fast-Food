import indicadoresModel from "../models/indicadores.model.js";

// Crear un nuevo reporte de indicadores
const dbCreateIndicadores = async (newIndicadores) => {
    return await indicadoresModel.create(newIndicadores); 
}

// Obtener el reporte más reciente
const dbReadLatestIndicadores = async () => {
    return await indicadoresModel.findOne().sort({ createdAt: -1 });
}

// NUEVA FUNCIÓN: Actualizar las métricas en tiempo real cuando hay una venta
const dbUpdateIndicadoresOnVenta = async (nuevaVenta) => {
    const indicador = await dbReadLatestIndicadores();
    if (!indicador) return; // Si no hay indicadores creados, cancela la operación

    // Funciones de ayuda para quitar el formato "$12.000" a número y viceversa
    const parseNum = (str) => parseInt(str.replace(/[^0-9]/g, ''), 10);
    const formatMoney = (num) => '$' + new Intl.NumberFormat('es-CO').format(num);
    const formatNum = (num) => new Intl.NumberFormat('es-CO').format(num);

    // Extraer datos de la nueva venta
    const totalVenta = nuevaVenta.totalPagado;
    const totalProductos = nuevaVenta.detalles.reduce((acc, item) => acc + item.cantidad, 0);

    // 1. Actualizar los KPIs principales (Tarjetas superiores)
    indicador.kpis.forEach(kpi => {
        if (kpi.id === 'k1' || kpi.id === 'k2') { // Ventas del mes y del año
            const valorActual = parseNum(kpi.value);
            kpi.value = formatMoney(valorActual + totalVenta);
        }
        if (kpi.id === 'k3') { // Productos vendidos
            const valorActual = parseNum(kpi.value);
            kpi.value = formatNum(valorActual + totalProductos);
        }
    });

    // 2. Actualizar las Metas (Goal)
    const metaAnual = parseNum(indicador.goal.value);
    const ventasAñoActual = parseNum(indicador.kpis.find(k => k.id === 'k2').value); // Toma el valor ya sumado
    
    const faltante = metaAnual - ventasAñoActual;
    indicador.goal.remaining = formatMoney(faltante > 0 ? faltante : 0);
    indicador.goal.progressPercent = parseFloat(((ventasAñoActual / metaAnual) * 100).toFixed(1));

    // 3. Actualizar el panel de Comparación de Ventas
    indicador.comparison.current.sales = formatMoney(parseNum(indicador.comparison.current.sales) + totalVenta);
    indicador.comparison.current.products = formatNum(parseNum(indicador.comparison.current.products) + totalProductos);
    indicador.comparison.monthly.value = formatMoney(parseNum(indicador.comparison.monthly.value) + totalVenta);

    // Guardar los cambios directamente en MongoDB
    await indicador.save();
}

export { dbCreateIndicadores, dbReadLatestIndicadores, dbUpdateIndicadoresOnVenta };