import { Router } from 'express';
import { createCategory, getCategory, getCategories, updateCategory, deleteCategory } from '../controllers/categories.controller.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// '/', Ruta. []. Lista de Controla
// Define las rutas para las categorias
router.post('/', [ authMiddleware, authorizationMiddleware(['Administrador', 'Empleado']) ],  createCategory);
router.get('/:id', authMiddleware, getCategory);
router.get('/', authMiddleware, getCategories);
router.patch('/:id', authMiddleware, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

// Exportar las rutas definidas en este archivo
export default router;