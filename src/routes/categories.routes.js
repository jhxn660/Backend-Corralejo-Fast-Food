import { Router } from "express";
import { createCategory, deleteCategory, getCategories, getCategory, updateCategory } from "../controllers/categories.controllers.js";
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js'

// crea una instancia de las rutas de express
const router = Router();       

// Define las rutas para las categorias 
router.post( '/', [ authMiddleware, authorizationMiddleware(['ADMIN']) ], createCategory );
router.get( '/', [ authMiddleware, authorizationMiddleware(['ADMIN', 'EMPLEADO']) ], getCategories );
router.delete( '/:id', [ authMiddleware, authorizationMiddleware(['ADMIN']) ], deleteCategory );
router.patch( '/:id', [ authMiddleware, authorizationMiddleware(['ADMIN']) ], updateCategory );
router.get( '/:id', [ authMiddleware, authorizationMiddleware(['ADMIN', 'EMPLEADO']) ], getCategory)

// Exportar las rutas definidas en este archivo
export default router;