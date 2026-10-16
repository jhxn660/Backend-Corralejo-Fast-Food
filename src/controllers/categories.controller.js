import { dbCreateCategory, dbDeleteCategory, dbGetCategories } from "../services/categories.services.js";

const createCategory = async (req, res) => {

    try {

        // Extrae los datos del cuerpo de la petición
        const inputData = req.body;

        // Usar el servicio para registrar
        const data = await dbCreateCategory(inputData);

        res.json({ msg: 'Registra Categoria', data: data });

    }
    catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo registrar la categoria' });
    }

}

const getCategories = async (req, res) => {
    const data = await dbGetCategories();

    res.json({
        msg: 'Lista de Categorias', data: data
    });
}

const deleCategory = async (req, res) => {
    const id = req.params.id;

    const data = await dbDeleteCategory(id);

    res.json({ msg: 'Elimina una Categoria', data: data});
}

export {
    createCategory,
    getCategories,
    deleCategory
}