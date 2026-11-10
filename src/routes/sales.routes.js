import { Router } from 'express';
import { CreateSales, GetSales, UpdateAllSales, UpdatePartialSales, DeleteSales } from '../controllers/sales.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

const router = Router();

router.post('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], CreateSales);
router.get('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], GetSales);
router.put('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], UpdateAllSales);
router.patch('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], UpdatePartialSales);
router.delete('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], DeleteSales);

export default router;
