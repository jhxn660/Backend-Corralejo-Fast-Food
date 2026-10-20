import indicadoresModel from "../models/indicadores.model.js";

// Crear o inicializar un nuevo reporte de indicadores
const dbCreateIndicadores = async (newIndicadores) => {
    return await indicadoresModel.create(newIndicadores); 
}

// Obtener el reporte de indicadores más reciente
const dbReadLatestIndicadores = async () => {
    // Busca el último creado ordenando por fecha de forma descendente
    return await indicadoresModel.findOne().sort({ createdAt: -1 });
}

export { dbCreateIndicadores, dbReadLatestIndicadores };