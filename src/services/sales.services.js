import saleModel from "../models/sale.model.js";

const dbCreateSale = async (newSale) => {
    return await saleModel.create(newSale);
};

// Las lecturas resuelven `pedidoAsociado` para devolver el pedido completo y
// evitarle al cliente una segunda consulta por cada venta.
const dbReadSaleById = async (id) => {
    return await saleModel.findById(id).populate('pedidoAsociado');
};

const dbReadSales = async () => {
    return await saleModel.find().populate('pedidoAsociado');
};

// CAMBIO: búsqueda por el identificador impreso en el QR del ticket. La usa el módulo de
// comentarios para comprobar que el código escaneado corresponde a una venta real.
const dbReadSaleByTicket = async (idTicketVenta) => {
    return await saleModel.findOne({ idTicketVenta });
};

export {
    dbCreateSale,
    dbReadSaleById,
    dbReadSales,
    dbReadSaleByTicket
};
