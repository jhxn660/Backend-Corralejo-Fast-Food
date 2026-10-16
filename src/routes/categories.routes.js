import { Router } from "express";
import { createCategory, deleteCategory, getCategories, getCategory, updateCategory } from "../controllers/categories.controller.js";

// Crea una instancia de las rutas de Express
const router = Router();        

// Define las rutas para las categorias
router.post( '/', createCategory );
router.get('/', getCategories);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.get( '/:id', getCategory)

// Exportar las rutas definidas en este archivo
export default router;