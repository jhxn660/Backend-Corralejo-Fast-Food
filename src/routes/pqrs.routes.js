import { Router } from 'express';

import { ROLES, ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import {
    createPQRS,
    getPQRS,
    getPQRSList,
    getMyPQRSList,
    updatePQRS,
    deletePQRS
} from '../controllers/pqrs.controllers.js';

const router = Router();

// Crear una PQRS es solo del Cliente (usuario registrado).
router.post('/', requireRoles([ ROLES.CLIENT ]), createPQRS);

// El Cliente lee sus propias PQRS (con la respuesta del restaurante).
// Va ANTES de '/:id': si no, Express tomaría «mine» como un id.
router.get('/mine', requireRoles([ ROLES.CLIENT ]), getMyPQRSList);

// El personal lee todas las PQRS; responderlas y eliminarlas es de administración.
router.get('/:id', requireRoles(STAFF_ROLES), getPQRS);
router.get('/', requireRoles(STAFF_ROLES), getPQRSList);
router.patch('/:id', requireRoles(ADMIN_ROLES), updatePQRS);
router.delete('/:id', requireRoles(ADMIN_ROLES), deletePQRS);

export default router;
