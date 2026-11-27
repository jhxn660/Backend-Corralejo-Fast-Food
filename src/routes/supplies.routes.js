import { Router } from 'express';

import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { createSupply, getSupply, getSupplies, updateSupply, deleteSupply } from '../controllers/supplies.controllers.js';

const router = Router();

router.post('/', requireRoles(ADMIN_ROLES), createSupply);
router.get('/', requireRoles(STAFF_ROLES), getSupplies);
router.get('/:id', requireRoles(STAFF_ROLES), getSupply);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateSupply);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteSupply);

export default router;
