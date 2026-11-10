import { Router } from 'express';
import { CreateOrders, GetOrders, UpdateAllOrders, UpdatePartialOrders, DeleteOrders } from '../controllers/orders.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

const router = Router();

router.post('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], CreateOrders);
router.get('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], GetOrders);
router.put('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], UpdateAllOrders);
router.patch('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], UpdatePartialOrders);
router.delete('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], DeleteOrders);

export default router;
