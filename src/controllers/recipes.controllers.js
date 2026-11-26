import asyncHandler from '../helpers/async-handler.helper.js';
import { assertFound } from '../helpers/http-error.helper.js';
import {
    dbCreateRecipe,
    dbDeleteRecipe,
    dbGetRecipe,
    dbGetRecipes,
    dbUpdateRecipe
} from '../services/recipes.services.js';

const NOT_FOUND = 'Receta no encontrada';

// Body: { product, items: [{ supply, quantity }] }. Quien la registra sale del token.
const createRecipe = asyncHandler(async (req, res) => {
    const { product, items } = req.body;
    const data = await dbCreateRecipe({ product, items, createdBy: req.userFound._id });

    res.status(201).json({ msg: 'Registrar receta', data });
}, 'No se pudo registrar la receta');

const getRecipes = asyncHandler(async (req, res) => {
    res.json({ msg: 'Listar recetas', data: await dbGetRecipes() });
}, 'No se pudieron listar las recetas');

const getRecipe = asyncHandler(async (req, res) => {
    res.json({ msg: 'Obtener receta por ID', data: assertFound(await dbGetRecipe(req.params.id), NOT_FOUND) });
}, 'No se pudo obtener la receta');

// Body: { items: [{ supply, quantity }] }. El producto de una receta no cambia.
const updateRecipe = asyncHandler(async (req, res) => {
    const data = assertFound(await dbUpdateRecipe(req.params.id, { items: req.body.items }), NOT_FOUND);

    res.json({ msg: 'Actualizar receta', data });
}, 'No se pudo actualizar la receta');

const deleteRecipe = asyncHandler(async (req, res) => {
    res.json({ msg: 'Eliminar receta', data: assertFound(await dbDeleteRecipe(req.params.id), NOT_FOUND) });
}, 'No se pudo eliminar la receta');

export {
    createRecipe,
    getRecipes,
    getRecipe,
    updateRecipe,
    deleteRecipe
};
