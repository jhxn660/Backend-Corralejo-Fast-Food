import { dbCreateCategory, dbDeleteCategory, dbGetCategories, dbGetCategory, dbUpdateCategory } from "../services/categories.services.js";

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
    try {
        const data = await dbGetCategories();

        res.json({
            msg: 'Lista de categorias',
            data: data
        });
    } catch (error) {
        console.error( error );
        res.json({
            msg: 'No ha podido obtener el listado de las categorias activas'
        })
    } 
}

const deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteCategory(id);

        res.json({ 
            msg: 'Elimina una categoria', 
            data: data
        });
    } catch (error) {
        console.error( error );

        res.json({
            msg: 'No se ha podido eliminar la categoria'
        })
    }
    
}

const updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body; 

        const data = await dbUpdateCategory( id, inputData );   // Suceptible de generar una excepcion

        res.json({ 
            msg: 'Categoria Actualizada',
            data: data
        });
    } catch (error) {
        console.error( error );

        res,json({
            msg: 'Nose ha podido actuaizar'
        })
    }
    
}

const getCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbGetCategory( id );

        res.json({
            msg: 'Obtiene una categoria',
            data: data
        });
    } catch (error) {
        console.error( error );
        res.json({
            msg: 'No se pudo obtener la categoria por ID'
        });
    }
}

export {
    createCategory,
    getCategories,
    deleteCategory,
    updateCategory,
    getCategory
}