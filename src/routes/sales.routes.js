import { Router } from 'express';

import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';
import { optionalAuthMiddleware } from '../middlewares/authenticate.middleware.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { createSale, getSales, getSale, updateSale, deleteSale } from '../controllers/sales.controllers.js';

const router = Router();

// Cada escritura reconsolida automáticamente los indicadores del día afectado.
router.post('/', requireRoles(STAFF_ROLES), createSale);
// LECTURA PARA TODOS: el personal recibe las ventas completas; clientes y visitantes solo
// fecha, estado y productos vendidos ("el más vendido del día"), nunca cliente ni empleado.
router.get('/', optionalAuthMiddleware, getSales);
router.get('/:id', requireRoles(STAFF_ROLES), getSale);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateSale);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteSale);

export default router;
