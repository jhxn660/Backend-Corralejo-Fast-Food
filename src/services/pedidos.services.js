//Servicio se habla en la base de datos
//Estas funciones realizarán las consultas a la base de datos 

import pedidoModel from "../models/pedido.model.js";

//TODO: Conectar el modelo de usuarios con la base de datos
const dbCreatePedidos = async (newPedido) => {
    return await pedidoModel.create(newPedido);         //promesa resuelta //await
}

const dbreadPedidos = () => {}

const dbupdateAllPedidos = () => {}

const dbupdatePartialPedidos = () => {}

const dbdeletePedidos = () => {}

export {dbCreatePedidos, dbreadPedidos, dbupdateAllPedidos, dbupdatePartialPedidos, dbdeletePedidos}
