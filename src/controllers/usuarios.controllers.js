// Controlador define quien hace una acción especifica

const getUsuario = (req, res) => {
    res.json({ msg: 'Obtiene todos los usuarios' });
}

const createUsuario = (req, res) => {
    res.json({ msg: 'Registra Usuario' });
}

const updatePUsuario = (req, res) => {
    res.json({ msg: 'Actualizar todas las propiedades de un usuario' });
}

const updateMPUsuario = (req, res) => {
    res.json({ msg: 'Actualizar una o mas propiedades del usuario' });
}

const deleteUsuario = (req, res) => {
    res.json({ msg: 'Elimina un Usuario' });
}


export {
    getUsuario, createUsuario, updatePUsuario, updateMPUsuario, deleteUsuario
}