import {dbCreatemenu} from "../services/menu.services.js"

const getmenu = (req, res) => {
    res.json({msg: 'Listar todas las categorias'});
}

const createmenu = async (req, res) => {
    try {
    // Obtenemos el usuario desde el cuerpo de la peticion
    const menu = req.body;

    // Conecta con el servidor para crear un usuario en ñla base de datos
    const newMenu = await dbCreatemenu(menu);     //Llega como una promesa y se resume

    // Respuesta al cliente
    res.json({msg: 'Registra categoria', menu: newMenu });

    } 
    catch (error) {
        console.error( error );
        res.json({
        msg: 'Error al registrar usuario'
    });
    }

}

const updatemenu = (req, res) => {
    res.json({msg: 'Actualizar todas las categorias'});
}

const updattemenu = (req, res) => {
    res.json({msg: 'Actualizar una o mas categorias'});
}

const deletemenu = (req, res) => {
    res.json({msg: 'Eliminar categoria'});
}

export {
    getmenu, createmenu, updatemenu, updattemenu, deletemenu
}