import { Router } from 'express';
import {
    createCategory,
    getCategory,
    getCategories,
    updateCategory,
    deleteCategory
} from '../controllers/categories.controller.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// Define las rutas para las categorias
router.post('/', authMiddleware, createCategory);
router.get('/:id', authMiddleware, getCategory);
router.get('/', authMiddleware, getCategories);
router.patch('/:id', authMiddleware, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

// Exportar las rutas definidas en este archivo
export default router;