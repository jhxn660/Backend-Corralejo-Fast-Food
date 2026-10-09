//El controllador define quien hace una acción especifica
const CreatePedidos = (req, res) => {
    res.send('Registra un pedido!!')
}

export {CreatePedidos}

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