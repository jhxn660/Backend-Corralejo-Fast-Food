import { dbCreateVentas, dbReadVentas } from "../services/ventas.services.js";

const CreateVentas = async (req, res) => {
    try {
        const dVenta = req.body;
        const newVenta = await dbCreateVentas(dVenta); 
        
        res.json({
            msg: '¡Venta registrada con éxito!', 
            venta: newVenta
        });
    } catch (error) {
        console.error("Error al registrar la venta: ", error);
        res.status(500).json({
            msg: 'Error al crear la venta, revisa la consola para más detalles',
            error: error.message // Esto te ayudará a ver qué falló directamente en Bruno
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