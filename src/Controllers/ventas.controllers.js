import { dbCreateVentas, dbReadVentas } from "../services/ventas.services.js";
// Importamos la nueva función del servicio de indicadores
import { dbUpdateIndicadoresOnVenta } from "../services/indicadores.services.js"; 

const CreateVentas = async (req, res) => {
    try {
        const dVenta = req.body;
        
        // 1. Guarda la nueva venta en la colección de ventas
        const newVenta = await dbCreateVentas(dVenta); 
        
        // 2. ¡LA MAGIA OCURRE AQUÍ! Actualiza las métricas en tiempo real
        await dbUpdateIndicadoresOnVenta(newVenta);
        
        res.json({
            msg: '¡Venta registrada con éxito y métricas actualizadas!', 
            venta: newVenta
        });
    } catch (error) {
        console.error("Error al registrar la venta: ", error);
        res.status(500).json({
            msg: 'Error al crear la venta, revisa la consola para más detalles',
            error: error.message 
        });
    }
};

const GetVentas = async (req, res) => {
    try {
        const ventas = await dbReadVentas();
        res.json({
            msg: 'Ventas obtenidas',
            ventas: ventas
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener las ventas' });
    }
};

const UpdateAllVentas = (req, res) => {
    res.send('Actualiza todas las propiedades de una venta!!');
};

const UpdatePartialVentas = (req, res) => {
    res.send('Actualiza una o mas propiedades de una venta!!');
};

const DeleteVentas = (req, res) => {
    res.send('Elimina una venta!!');
};

export { CreateVentas, GetVentas, UpdateAllVentas, UpdatePartialVentas, DeleteVentas };