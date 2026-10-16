// Servicio se habla con a base de datos.
// Estas funciones realizan las consultas a la base de datos

import menuModel from "../models/menu.model.js";

// TODO: conectar el modelo del menu con la base de datos
const dbGetmenu = () => {
}

const dbCreatemenu = async (newMenu) => {
    return await menuModel.create(newMenu);
}

const dbUpdatemenu = () => {}

const dbDeletemenu = () => {}

export {
    dbGetmenu ,dbCreatemenu, dbUpdatemenu, dbDeletemenu
}