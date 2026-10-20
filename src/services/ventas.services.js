import ventasModel from "../models/ventas.model.js";

// Crear una nueva venta
const dbCreateVentas = async (newVenta) => {
    return await ventasModel.create(newVenta); 
}

// Obtener todas las ventas
const dbReadVentas = async () => {
    return await ventasModel.find();
}

// Aquí puedes ir agregando las demás funciones para actualizar o eliminar
const dbUpdateAllVentas = () => {}
const dbUpdatePartialVentas = () => {}
const dbDeleteVentas = () => {}

export { dbCreateVentas, dbReadVentas, dbUpdateAllVentas, dbUpdatePartialVentas, dbDeleteVentas };