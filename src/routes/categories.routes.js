import { Router } from "express";
import { createCategory, deleteCategory, getCategories } from "../controllers/categories.controllers.js";

const router = Router();        // Crea una instancia de las rutas de EXPRESS

// Define las rutas para las categorias 
router.post( '/', createCategory );
router.get( '/', getCategories );
router.delete( '/:id', deleteCategory );

// Exportar las rutas definidas en este archivo
export default router;