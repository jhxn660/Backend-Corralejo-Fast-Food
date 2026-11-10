import { Router } from 'express';
import { createCategory, getCategory, getCategories, updateCategory, deleteCategory } from '../controllers/categories.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// '/', Ruta. []. Lista de Controla
// Define las rutas para las categorias
router.post('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ],  createCategory);
router.get('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getCategories);
router.get('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getCategory);
router.patch('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], updateCategory);
router.delete('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], deleteCategory);

// Exportar las rutas definidas en este archivo
export default router;
