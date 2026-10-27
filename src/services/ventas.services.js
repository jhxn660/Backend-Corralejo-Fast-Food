import ventasModel from "../models/ventas.model.js";

const dbCreateVentas = async (newVenta) => {
    return await ventasModel.create(newVenta); 
}

// AQUÍ ESTÁ EL CAMBIO CON POPULATE:
const dbReadVentas = async () => {
    return await ventasModel.find()
        .populate('pedidoAsociado'); // <-- Busca la referencia y trae todos los datos del pedido
}

// Si quieres una función para buscar una sola venta por su ID:
const dbReadVentaById = async (id) => {
    return await ventasModel.findById(id)
        .populate('pedidoAsociado');
}

export { dbCreateVentas, dbReadVentas, dbReadVentaById };