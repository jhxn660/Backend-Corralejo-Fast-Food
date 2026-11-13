import { Router } from 'express';
import { CreateSales, GetSales, UpdateAllSales, UpdatePartialSales, DeleteSales } from '../controllers/sales.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

const router = Router();

router.post('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], CreateSales);
router.get('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], GetSales);
router.put('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], UpdateAllSales);
router.patch('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], UpdatePartialSales);
router.delete('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], DeleteSales);

export default router;
