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
router.post('/establecimiento', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], createEstablecimiento);
router.get('/establecimiento/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getEstablecimiento);
router.get('/establecimiento', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getEstablecimientoList);
router.patch('/establecimiento/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], updateEstablecimiento);
router.delete('/establecimiento/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], deleteEstablecimiento);

// Horarios
router.post('/horarios', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], createHorario);
router.get('/horarios/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getHorario);
router.get('/horarios', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getHorarios);
router.patch('/horarios/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], updateHorario);
router.delete('/horarios/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], deleteHorario);

// Ubicaciones
router.post('/ubicaciones', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], createUbicacion);
router.get('/ubicaciones/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getUbicacion);
router.get('/ubicaciones', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' , 'Cliente' ]) ], getUbicaciones);
router.patch('/ubicaciones/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], updateUbicacion);
router.delete('/ubicaciones/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' , 'Cliente' ]) ], deleteUbicacion);

export default router;
