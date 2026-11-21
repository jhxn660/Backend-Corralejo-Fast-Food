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
// LECTURA: el Cliente solo recibe SUS PQRS; el personal (Empleado, Administrador, Owner) recibe
// todas las que enviaron los clientes. El filtro lo aplica el controlador según el rol.
const CLIENT_AND_STAFF = [ ROLES.CLIENT, ...STAFF_ROLES ];
router.get('/:id', requireRoles(CLIENT_AND_STAFF), getPQRS);
router.get('/', requireRoles(CLIENT_AND_STAFF), getPQRSList);
router.patch('/:id', requireRoles(ADMIN_ROLES), updatePQRS);
router.delete('/:id', requireRoles(ADMIN_ROLES), deletePQRS);

export default router;
