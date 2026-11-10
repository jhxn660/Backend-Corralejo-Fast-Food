import { Router } from 'express';
import {
    createPQRS,
    getPQRS,
    getPQRSList,
    updatePQRS,
    deletePQRS
} from '../controllers/pqrs.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

const router = Router();

// CAMBIO: crear una PQRS queda restringido al rol 'Cliente' (usuario registrado).
// Se reemplaza validarJWT, que leía un campo `uid` que el token nunca incluye, por la pareja
// authMiddleware + authorizationMiddleware que ya usa el resto de la API.
router.post('/', [ authMiddleware, authorizationMiddleware([ 'Cliente' ]) ], createPQRS);
router.get('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getPQRS);
router.get('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getPQRSList);
router.patch('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], updatePQRS);
router.delete('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], deletePQRS);

export default router;
