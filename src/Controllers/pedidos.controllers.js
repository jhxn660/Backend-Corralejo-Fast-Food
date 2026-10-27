import { dbCreatePedidos } from "../services/pedidos.services.js";

//El controllador define quien hace una acción especifica
const CreatePedidos = async (req, res) => {
    try{
        // Obtenemos los datos del pedido desde el cuerpo de la solicitud
    const dpedido = req.body;

    //Conecta con el servicio para crear un nuevo pedido en la base de datos
    const newpedido = await dbCreatePedidos(dpedido); // Llega como una promesa resuelta, ya que dbCreatePedidos es async y usamos await
    res.json({msg: 'Crea un pedido!!', 'pedido': newpedido});
} catch (error) {
    console.error( error );
    res.json({
        msg: 'Error al crear el pedido'
    });
}
};

export {CreatePedidos};

const GetPedidos = (req, res) => {
    res.send('Obten los pedidos!!')
}

export {GetPedidos}

const UpdateAllPedidos = (req, res) => {
    res.send('Actualiza todas las propiedades de un pedido!!')
}

export {UpdateAllPedidos}

const UpdatePartialPedidos = (req, res) => {
    res.send('Actualiza una o mas propiedades de un pedido!!')
}

export {UpdatePartialPedidos}

const DeletePedidos = (req, res) => {
    res.send('Elimina un pedido!!')
}

export {DeletePedidos}