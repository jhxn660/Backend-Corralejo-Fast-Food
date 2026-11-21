import { Router } from 'express';
import { createSale, getSales, getSale, updateSale, deleteSale } from '../controllers/sales.controllers.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { optionalAuthMiddleware } from '../middlewares/authenticate.middleware.js';
import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';

const router = Router();

// Cada escritura reconsolida automáticamente los indicadores del día afectado.
// CAMBIO: PUT/PATCH/DELETE operaban sobre '/' (sin ID); ahora actúan sobre una venta concreta.
router.post('/', requireRoles(STAFF_ROLES), createSale);
// LECTURA PARA TODOS: el personal recibe las ventas completas; clientes y visitantes solo
// reciben fecha, estado y productos vendidos (lo que necesita "el más vendido del día"),
// nunca el cliente ni el empleado. El controlador decide qué devolver según quién pregunta.
router.get('/', optionalAuthMiddleware, getSales);
router.get('/:id', requireRoles(STAFF_ROLES), getSale);
router.put('/:id', requireRoles(ADMIN_ROLES), updateSale);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateSale);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteSale);

export default router;
