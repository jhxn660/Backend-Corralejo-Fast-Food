import { dbCreateCategory, dbDeleteCategory, dbGetCategories } from "../services/categories.services.js";

const createCategory = async (req, res) => {
    try {
    // Exportar los datos del cuerpo de la peticion
    const inputData = req.body;

    // Usar el servicio para registrar
    const data = await dbCreateCategory( inputData );

    res.json({ msg: 'Registra categoria', data: data })
    } 
    catch (error) {
        console.error(error);

        res.json({ msg: 'No se pudo registrar la categoria' })
    }

}

const getCategories = async (req, res) => {
    const data = await dbGetCategories();

    res.json({
        msg: 'Lista de categorias',
        data: data
    });
}

const deleteCategory = async (req, res) => {
    const id = req.params.id;

    const data = await dbDeleteCategory(id);

    res.json({ 
        msg: 'Elimina una categoria', 
        data: data
     });
}

export {
    createCategory,
    getCategories,
    deleteCategory
}