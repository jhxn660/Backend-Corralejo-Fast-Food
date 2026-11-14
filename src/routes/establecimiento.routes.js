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
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';

// Este router se monta en /api (no en un prefijo propio) porque expone tres
// recursos hermanos del mismo dominio; cada ruta declara su prefijo completo.
const router = Router();

// Establecimiento
router.post('/establecimiento', requireRoles(ADMIN_ROLES), createEstablecimiento);
router.get('/establecimiento/:id', requireRoles(STAFF_ROLES), getEstablecimiento);
router.get('/establecimiento', requireRoles(STAFF_ROLES), getEstablecimientoList);
router.patch('/establecimiento/:id', requireRoles(ADMIN_ROLES), updateEstablecimiento);
router.delete('/establecimiento/:id', requireRoles(ADMIN_ROLES), deleteEstablecimiento);

// Horarios
router.post('/horarios', requireRoles(ADMIN_ROLES), createHorario);
router.get('/horarios/:id', requireRoles(STAFF_ROLES), getHorario);
router.get('/horarios', requireRoles(STAFF_ROLES), getHorarios);
router.patch('/horarios/:id', requireRoles(ADMIN_ROLES), updateHorario);
router.delete('/horarios/:id', requireRoles(ADMIN_ROLES), deleteHorario);

// Ubicaciones
router.post('/ubicaciones', requireRoles(ADMIN_ROLES), createUbicacion);
router.get('/ubicaciones/:id', requireRoles(STAFF_ROLES), getUbicacion);
router.get('/ubicaciones', requireRoles(STAFF_ROLES), getUbicaciones);
router.patch('/ubicaciones/:id', requireRoles(ADMIN_ROLES), updateUbicacion);
router.delete('/ubicaciones/:id', requireRoles(ADMIN_ROLES), deleteUbicacion);

export default router;
