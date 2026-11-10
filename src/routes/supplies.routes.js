import { Router } from 'express';
import { createSupply, getSupply, getSupplies, updateSupply, deleteSupply } from '../controllers/supplies.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// Define las rutas para los insumos
router.post('/', [ authMiddleware,  authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], createSupply);
router.get('/', [ authMiddleware,  authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getSupplies);
router.get('/:id', [ authMiddleware,  authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getSupply);
router.patch('/:id', [ authMiddleware,  authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], updateSupply);
router.delete('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], deleteSupply);

// Exportar las rutas definidas en este archivo
export default router;
