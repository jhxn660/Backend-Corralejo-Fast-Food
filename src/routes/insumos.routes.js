import { Router } from 'express';
import { createInsumo, getInsumo, getInsumos, updateInsumo, deleteInsumo } from '../controllers/insumos.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// Define las rutas para los insumos
router.post('/', [ authMiddleware,  authorizationMiddleware([ 'Administrador' ]) ], createInsumo);
router.get('/', [ authMiddleware,  authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getInsumos);
router.get('/:id', [ authMiddleware,  authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getInsumo);
router.patch('/:id', [ authMiddleware,  authorizationMiddleware([ 'Administrador' ]) ], updateInsumo);
router.delete('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], deleteInsumo);

// Exportar las rutas definidas en este archivo
export default router;