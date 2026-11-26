import { Router } from 'express';

import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { createOrder, getOrders, getOrder, addOrderItems, replaceOrderItems, updateOrder, deleteOrder } from '../controllers/orders.controllers.js';

const router = Router();

router.post('/', requireRoles(STAFF_ROLES), createOrder);
router.get('/', requireRoles(STAFF_ROLES), getOrders);
router.get('/:id', requireRoles(STAFF_ROLES), getOrder);
// Añadir productos a un pedido abierto (recalcula subtotales y total)
router.post('/:id/items', requireRoles(STAFF_ROLES), addOrderItems);
// Reemplazar la lista completa de productos de un pedido abierto (también quita y baja cantidades)
router.put('/:id/items', requireRoles(STAFF_ROLES), replaceOrderItems);
// Solo cambian el estado del pedido
router.patch('/:id', requireRoles(STAFF_ROLES), updateOrder);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteOrder);

export default router;
