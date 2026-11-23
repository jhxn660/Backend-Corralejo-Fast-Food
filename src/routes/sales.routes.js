import { Router } from 'express';
import { createSale, getSales, getSale, updateSale, deleteSale } from '../controllers/sales.controllers.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';

const router = Router();

// Cada escritura reconsolida automáticamente los indicadores del día afectado.
// CAMBIO: PUT/PATCH/DELETE operaban sobre '/' (sin ID); ahora actúan sobre una venta concreta.
router.post('/', requireRoles(STAFF_ROLES), createSale);
router.get('/', requireRoles(STAFF_ROLES), getSales);
router.get('/:id', requireRoles(STAFF_ROLES), getSale);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateSale);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteSale);

export default router;
