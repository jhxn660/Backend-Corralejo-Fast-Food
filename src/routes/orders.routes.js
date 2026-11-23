import { Router } from 'express';
import { createOrder, getOrders, getOrder, addOrderItems, updateOrder, deleteOrder } from '../controllers/orders.controllers.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';

const router = Router();

router.post('/', requireRoles(STAFF_ROLES), createOrder);
router.get('/', requireRoles(STAFF_ROLES), getOrders);
router.get('/:id', requireRoles(STAFF_ROLES), getOrder);
// Añadir productos a un pedido abierto (recalcula subtotales y total)
router.post('/:id/items', requireRoles(STAFF_ROLES), addOrderItems);
// Solo cambian el estado del pedido
router.patch('/:id', requireRoles(STAFF_ROLES), updateOrder);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteOrder);

export default router;
