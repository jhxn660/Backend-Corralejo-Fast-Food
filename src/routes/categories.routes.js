import { Router } from "express";
import { createCategory, deleCategory, getCategories } from "../controllers/categories.controller.js";

// Crea una instancia de las rutas de Express
const router = Router();        

// Define las rutas para las categorias
router.post( '/', createCategory );
router.get('/', getCategories);
router.delete('/:id', deleCategory)

// Exportar las rutas definidas en este archivo
export default router;