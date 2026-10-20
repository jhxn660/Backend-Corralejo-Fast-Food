import { dbCreateIndicadores, dbReadLatestIndicadores } from "../services/indicadores.services.js";

// POST: Crear un nuevo set de indicadores (Para probar desde Bruno)
const CreateIndicadores = async (req, res) => {
    try {
        const data = req.body;
        const newIndicadores = await dbCreateIndicadores(data);
        res.json({ msg: 'Indicadores creados con éxito', data: newIndicadores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al crear indicadores', error: error.message });
    }
};

// GET: Controladores específicos para cada parte del frontend
const GetKpis = async (req, res) => {
    try {
        const data = await dbReadLatestIndicadores();
        res.json(data ? data.kpis : []); // Devuelve solo el array de KPIs
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const GetGoal = async (req, res) => {
    try {
        const data = await dbReadLatestIndicadores();
        res.json(data ? data.goal : {}); 
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const GetComparison = async (req, res) => {
    try {
        const data = await dbReadLatestIndicadores();
        res.json(data ? data.comparison : {});
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const GetProductRows = async (req, res) => {
    try {
        const data = await dbReadLatestIndicadores();
        res.json(data ? data.productRows : []);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const GetRanking = async (req, res) => {
    try {
        const data = await dbReadLatestIndicadores();
        res.json(data ? data.ranking : []);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const GetReviews = async (req, res) => {
    try {
        const data = await dbReadLatestIndicadores();
        res.json(data ? data.reviews : []);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

export { CreateIndicadores, GetKpis, GetGoal, GetComparison, GetProductRows, GetRanking, GetReviews };