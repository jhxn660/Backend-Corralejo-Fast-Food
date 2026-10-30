import { Router } from 'express';
import {
    createInsumo,
    getInsumo,
    getInsumos,
    updateInsumo,
    deleteInsumo
} from '../controllers/insumos.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// Define las rutas para los insumos
router.post('/', authMiddleware, createInsumo);
router.get('/:id', authMiddleware, getInsumo);
router.get('/', authMiddleware, getInsumos);
router.patch('/:id', authMiddleware, updateInsumo);
router.delete('/:id', authMiddleware, deleteInsumo);

// Exportar las rutas definidas en este archivo
export default router;