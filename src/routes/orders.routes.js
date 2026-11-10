import { Router } from 'express';
import { CreateOrders, GetOrders, UpdateAllOrders, UpdatePartialOrders, DeleteOrders } from '../controllers/orders.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

const router = Router();

router.post('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], CreateOrders);
router.get('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], GetOrders);
router.put('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], UpdateAllOrders);
router.patch('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], UpdatePartialOrders);
router.delete('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], DeleteOrders);

export default router;
