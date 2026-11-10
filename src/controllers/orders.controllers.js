import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import { dbCreateOrder } from "../services/orders.services.js";

const CreateOrders = async (req, res) => {
    try {
        const orderData = req.body;

        const newOrder = await dbCreateOrder(orderData);

        res.status(201).json({ msg: 'Crea un pedido!!', order: newOrder });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'Error al crear el pedido' });
    }
};

// Los handlers siguientes son marcadores de posición: fijan el contrato de rutas
// del módulo mientras se implementa la lectura, actualización y borrado en el servicio.
const GetOrders = (req, res) => {
    res.send('Obten los pedidos!!');
};

const UpdateAllOrders = (req, res) => {
    res.send('Actualiza todas las propiedades de un pedido!!');
};

const UpdatePartialOrders = (req, res) => {
    res.send('Actualiza una o mas propiedades de un pedido!!');
};

const DeleteOrders = (req, res) => {
    res.send('Elimina un pedido!!');
};

export {
    CreateOrders,
    GetOrders,
    UpdateAllOrders,
    UpdatePartialOrders,
    DeleteOrders
};
