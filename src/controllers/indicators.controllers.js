import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import { dbCreateIndicators, dbReadLatestIndicators } from "../services/indicators.services.js";

const CreateIndicators = async (req, res) => {
    try {
        const data = req.body;

        const newIndicators = await dbCreateIndicators(data);

        res.status(201).json({ msg: 'Indicadores creados con éxito', data: newIndicators });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'Error al crear indicadores.', error: error.message });
    }
};

/**
 * Fábrica de handlers GET del dashboard.
 * Todos los indicadores viven en un único documento (el reporte más reciente) y cada
 * widget del frontend consume solo una sección; en vez de repetir el mismo try/catch
 * por sección, se genera el handler a partir del nombre de la propiedad.
 *
 * @param {string} section - Propiedad del documento de indicadores a devolver
 * @param {Array|Object} emptyValue - Respuesta cuando aún no existe ningún reporte,
 *        para que el frontend reciba siempre el tipo que espera renderizar
 */
const sendLatestSection = (section, emptyValue) => async (req, res) => {
    try {
        const data = await dbReadLatestIndicators();

        res.json(data ? data[section] : emptyValue);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const GetKpis = sendLatestSection('kpis', []);
const GetGoal = sendLatestSection('goal', {});
const GetComparison = sendLatestSection('comparison', {});
const GetProductRows = sendLatestSection('productRows', []);
const GetRanking = sendLatestSection('ranking', []);
const GetReviews = sendLatestSection('reviews', []);

export {
    CreateIndicators,
    GetKpis,
    GetGoal,
    GetComparison,
    GetProductRows,
    GetRanking,
    GetReviews
};
