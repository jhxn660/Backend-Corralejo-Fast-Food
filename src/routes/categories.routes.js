import { Router } from 'express';
import { createCategory, getCategory, getCategories, updateCategory, deleteCategory } from '../controllers/categories.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// '/', Ruta. []. Lista de Controla
// Define las rutas para las categorias
router.post('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ],  createCategory);
router.get('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getCategories);
router.get('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getCategory);
router.patch('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], updateCategory);
router.delete('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], deleteCategory);

// Exportar las rutas definidas en este archivo
export default router;