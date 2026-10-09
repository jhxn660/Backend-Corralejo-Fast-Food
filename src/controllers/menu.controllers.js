const listmenu = (req, res) => {
    res.send('Listar todas las categorias');
}

const createmenu = (req, res) => {
    res.send('Registra categoria');
}

const updatemenu = (req, res) => {
    res.send('Actualizar todas las categorias');
}

const updattemenu = (req, res) => {
    res.send('Actualizar una o mas categorias');
}

const deletemenu = (req, res) => {
    res.send('Eliminar categoria');
}

export {
    listmenu, createmenu, updatemenu, updattemenu, deletemenu
}