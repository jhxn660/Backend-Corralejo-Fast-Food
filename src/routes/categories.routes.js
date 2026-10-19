import { Router } from "express";
import { createCategory, getCategory, getCategories, updateCategory, deleteCategory } from "../controllers/categories.controller.js";

// Crea una instancia de las rutas de Express
const router = Router();        

// Define las rutas para las categorias
router.post( '/', createCategory );
router.get( '/:id', getCategory);
router.get('/', getCategories);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

// Exportar las rutas definidas en este archivo
export default router;