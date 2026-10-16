import { Router } from "express";
import { createCategory, deleteCategory, getCategories, getCategory, updateCategory } from "../controllers/categories.controllers.js";

const router = Router();        // Crea una instancia de las rutas de EXPRESS

// Define las rutas para las categorias 
router.post( '/', createCategory );
router.get( '/', getCategories );
router.delete( '/:id', deleteCategory );
router.patch( '/:id', updateCategory );
router.get( '/:id', getCategory)

// Exportar las rutas definidas en este archivo
export default router;