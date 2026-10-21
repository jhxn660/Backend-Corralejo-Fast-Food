import { dbCreateCategory, dbGetCategory, dbGetCategories, dbUpdateCategory, dbDeleteCategory } from "../services/categories.services.js";

const createCategory = async (req, res) => {

    try {

        // Extrae los datos del cuerpo de la petición
        const inputData = req.body;

        // Usar el servicio para registrar
        const data = await dbCreateCategory(inputData);

        res.status(201).json({ msg: 'Registra Categoria', data: data });

    }
    catch (error) {
        console.error(error);

        // Personaliza los mensajes de error definidos en el Modelo
        if (error.name == 'ValidationError') {
            const errors = {};

            // Iterar los errores para extraer el nombre de la propiedad y el error especifico
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }

            res.status(400).json({ errors });
        }

        // Error generico   
        res.json({ msg: 'No se pudo registrar la categoria' });
    }

}

const getCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbGetCategory(id);

        res.status(200).json({ msg: 'Obtiene una categoria', data: data });

    }
    catch (error) {
        console.error(error);
        res.json({ msg: 'No se pudo obtener la categoria por id' });
    }
}

const getCategories = async (req, res) => {
    try {
        const data = await dbGetCategories();

        res.status(200).json({ msg: 'Lista de Categorias', data: data });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'No ha podido obtener las categorias' });
    }
}

const updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;

        const data = await dbUpdateCategory(id, inputData); // <---- Linea suceptible de generar una exception = Excepción

        res.status(200).json({ msg: 'Categoria Actualizada', data: data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'No se actualizo la categoria' });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteCategory(id);

        res.status(200).json({ msg: 'Categoria Eliminada', data: data });
    }
    catch (error) {
        console.error(error);
        res.status(501).json({ msg: 'No se ha podido eliminar la categoria' });
    }
}


export {
    createCategory,
    getCategory,
    getCategories,
    deleteCategory,
    updateCategory
}