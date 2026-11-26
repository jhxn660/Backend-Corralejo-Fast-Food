import asyncHandler from '../helpers/async-handler.helper.js';
import { assertFound } from '../helpers/http-error.helper.js';
import { dbCreateCategory, dbGetCategory, dbGetCategories, dbUpdateCategory, dbDeleteCategory } from '../services/categories.services.js';

/**
 * CAPA DE CONTROLADORES. Un controlador traduce entre HTTP y el negocio, y nada más:
 *   1. Lee la petición (req.params, req.query, req.body, req.userFound).
 *   2. Decide qué datos del body se aceptan (aquí: nunca `createdBy`, lo pone el servidor).
 *   3. Llama al servicio, que es quien habla con la base de datos.
 *   4. Arma la respuesta con el contrato único de la API: { msg, data }.
 * No tiene try/catch: asyncHandler envía cualquier error al errorHandler central, y el segundo
 * argumento es el mensaje del 500 si el error no se reconoce. assertFound convierte el `null`
 * de "ese id no existe" en un 404.
 */
const NOT_FOUND = 'Categoria no encontrada';

const createCategory = asyncHandler(async (req, res) => {
    // El creador es el usuario autenticado, nunca el que venga en el body
    const data = await dbCreateCategory({ ...req.body, createdBy: req.userFound._id });

    res.status(201).json({ msg: 'Registra Categoria', data });
}, 'No se pudo registrar la categoria');

const getCategory = asyncHandler(async (req, res) => {
    res.json({ msg: 'Obtiene una categoria', data: assertFound(await dbGetCategory(req.params.id), NOT_FOUND) });
}, 'No se pudo obtener la categoria por id');

const getCategories = asyncHandler(async (req, res) => {
    res.json({ msg: 'Lista de Categorias', data: await dbGetCategories() });
}, 'No ha podido obtener las categorias');

const updateCategory = asyncHandler(async (req, res) => {
    const { createdBy, ...changes } = req.body;

    res.json({ msg: 'Categoria Actualizada', data: assertFound(await dbUpdateCategory(req.params.id, changes), NOT_FOUND) });
}, 'No se actualizo la categoria');

// Borrado físico. Productos e insumos que la referencian quedan con un `category` huérfano
// (populate devuelve null): para retirarla de la vista conviene usar `status: false`.
const deleteCategory = asyncHandler(async (req, res) => {
    res.json({ msg: 'Categoria Eliminada', data: assertFound(await dbDeleteCategory(req.params.id), NOT_FOUND) });
}, 'No se ha podido eliminar la categoria');

export {
    createCategory,
    getCategory,
    getCategories,
    updateCategory,
    deleteCategory
};
