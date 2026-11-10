import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import { dbCreateSale, dbReadSales } from "../services/sales.services.js";
import { dbUpdateIndicatorsOnSale } from "../services/indicators.services.js";

const CreateSales = async (req, res) => {
    try {
        const saleData = req.body;

        const newSale = await dbCreateSale(saleData);

        // Los indicadores se actualizan después de persistir la venta y sin transacción:
        // si este paso falla, la venta ya quedó guardada y el cliente recibe un 500.
        await dbUpdateIndicatorsOnSale(newSale);

        res.status(201).json({
            msg: '¡Venta registrada con éxito y métricas actualizadas!',
            sale: newSale
        });
    } catch (error) {
        console.error("Error al registrar la venta: ", error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'Error al crear la venta, revisa la consola para más detalles',
            error: error.message
        });
    }
};

const GetSales = async (req, res) => {
    try {
        const sales = await dbReadSales();

        res.json({ msg: 'Ventas obtenidas', sales });
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener las ventas' });
    }
};

// Marcadores de posición: reservan el contrato de rutas hasta implementar el servicio.
const UpdateAllSales = (req, res) => {
    res.send('Actualiza todas las propiedades de una venta!!');
};

const UpdatePartialSales = (req, res) => {
    res.send('Actualiza una o mas propiedades de una venta!!');
};

const DeleteSales = (req, res) => {
    res.send('Elimina una venta!!');
};

export {
    CreateSales,
    GetSales,
    UpdateAllSales,
    UpdatePartialSales,
    DeleteSales
};
