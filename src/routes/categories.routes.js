import { Router } from "express";
import { createCategory, deleteCategory, getCategories, getCategory, updateCategory } from "../controllers/categories.controllers.js";
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js'

// crea una instancia de las rutas de express
const router = Router();       

// Define las rutas para las categorias 
router.post( '/', [ authMiddleware, authorizationMiddleware ], createCategory );
router.get( '/', getCategories );
router.delete( '/:id', authMiddleware, deleteCategory );
router.patch( '/:id', authMiddleware, updateCategory );
router.get( '/:id', authMiddleware, getCategory)

// Exportar las rutas definidas en este archivo
export default router;