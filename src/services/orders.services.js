import orderModel from "../models/order.model.js";

const dbCreateOrder = async (newOrder) => {
    return await orderModel.create(newOrder);
};

// TODO: implementar las consultas restantes. Se exportan vacías para que el
// contrato del servicio quede definido y los controladores puedan enlazarse sin romper imports.
const dbReadOrders = () => {};

const dbUpdateAllOrders = () => {};

const dbUpdatePartialOrders = () => {};

const dbDeleteOrders = () => {};

export {
    dbCreateOrder,
    dbReadOrders,
    dbUpdateAllOrders,
    dbUpdatePartialOrders,
    dbDeleteOrders
};
