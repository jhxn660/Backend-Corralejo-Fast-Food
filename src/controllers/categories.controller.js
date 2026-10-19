import { dbCreateCategory, dbGetCategory, dbGetCategories, dbUpdateCategory, dbDeleteCategory } from "../services/categories.services.js";

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

const getCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbGetCategory(id);

        res.json({ msg: 'Obtiene una categoria', data: data });

    }
    catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo obtener la categoria por id' });
    }
}

const getCategories = async (req, res) => {
    try {
        const data = await dbGetCategories();

        res.json({ msg: 'Lista de Categorias', data: data });

    }
    catch (error) {
        console.error(error);
        res.json({ msg: 'No ha podido obtener las categorias' });
    }
}

const updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;

        const data = await dbUpdateCategory(id, inputData); // <---- Linea suceptible de generar una exception = Excepción

        res.json({ msg: 'Categoria Actualizada', data: data });
    }
    catch (error) {
        console.error(error);
        res.json({ msg: 'No se actualizo la categoria' });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteCategory(id);

        res.json({ msg: 'Elimina una Categoria', data: data });
    }
    catch (error) {
        console.error(error);
        res.json({ msg: 'No se ha podido eliminar la categoria' });
    }
}


export {
    createCategory,
    getCategory,
    getCategories,
    deleteCategory,
    updateCategory
}