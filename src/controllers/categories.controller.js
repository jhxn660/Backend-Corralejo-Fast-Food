import { dbCreateCategory } from "../services/categories.services.js";

const createCategory = async ( req, res ) => {
    
    try{

    // Extrae los datos del cuerpo de la petición
    const inputData = req.body;

    // Usar el servicio para registrar
    const data = await dbCreateCategory( inputData );

    res.json({ msg: 'Registra Categoria', data: data });  

    }
    catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo registrar la categoria'});
    }


}

export {
    createCategory
}