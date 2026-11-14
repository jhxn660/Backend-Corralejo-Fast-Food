import { Router } from 'express';
import {
    createPQRS,
    getPQRS,
    getPQRSList,
    updatePQRS,
    deletePQRS
} from '../controllers/pqrs.controllers.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { ROLES, ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';

const router = Router();

// CAMBIO: crear una PQRS queda restringido al rol 'Cliente' (usuario registrado).
// Se reemplaza validarJWT, que leía un campo `uid` que el token nunca incluye, por la pareja
// authMiddleware + authorizationMiddleware que ya usa el resto de la API.
router.post('/', requireRoles([ ROLES.CLIENT ]), createPQRS);
router.get('/:id', requireRoles(STAFF_ROLES), getPQRS);
router.get('/', requireRoles(STAFF_ROLES), getPQRSList);
router.patch('/:id', requireRoles(ADMIN_ROLES), updatePQRS);
router.delete('/:id', requireRoles(ADMIN_ROLES), deletePQRS);

export default router;
