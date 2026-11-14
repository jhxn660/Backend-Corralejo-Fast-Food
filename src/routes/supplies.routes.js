import { Router } from 'express';
import { createSupply, getSupply, getSupplies, updateSupply, deleteSupply } from '../controllers/supplies.controllers.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';

// Crea una instancia de las rutas de Express
const router = Router();

// Define las rutas para los insumos
router.post('/', requireRoles(ADMIN_ROLES), createSupply);
router.get('/', requireRoles(STAFF_ROLES), getSupplies);
router.get('/:id', requireRoles(STAFF_ROLES), getSupply);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateSupply);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteSupply);

// Exportar las rutas definidas en este archivo
export default router;
