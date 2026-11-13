import { Router } from 'express';
import {
    createEstablecimiento,
    getEstablecimiento,
    getEstablecimientoList,
    updateEstablecimiento,
    deleteEstablecimiento,
    createHorario,
    getHorario,
    getHorarios,
    updateHorario,
    deleteHorario,
    createUbicacion,
    getUbicacion,
    getUbicaciones,
    updateUbicacion,
    deleteUbicacion
} from '../controllers/establecimiento.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

// Este router se monta en /api (no en un prefijo propio) porque expone tres
// recursos hermanos del mismo dominio; cada ruta declara su prefijo completo.
const router = Router();

// Establecimiento
router.post('/establecimiento', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], createEstablecimiento);
router.get('/establecimiento/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getEstablecimiento);
router.get('/establecimiento', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getEstablecimientoList);
router.patch('/establecimiento/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], updateEstablecimiento);
router.delete('/establecimiento/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], deleteEstablecimiento);

// Horarios
router.post('/horarios', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], createHorario);
router.get('/horarios/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getHorario);
router.get('/horarios', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getHorarios);
router.patch('/horarios/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], updateHorario);
router.delete('/horarios/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], deleteHorario);

// Ubicaciones
router.post('/ubicaciones', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], createUbicacion);
router.get('/ubicaciones/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getUbicacion);
router.get('/ubicaciones', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getUbicaciones);
router.patch('/ubicaciones/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], updateUbicacion);
router.delete('/ubicaciones/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], deleteUbicacion);

export default router;
