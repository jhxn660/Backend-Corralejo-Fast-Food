import { Router } from 'express';

import { ADMIN_ROLES } from '../config/roles.config.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
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

// Este router se monta en /api (no en un prefijo propio) porque expone tres
// recursos hermanos del mismo dominio; cada ruta declara su prefijo completo.
const router = Router();

// Establecimiento
router.post('/establecimiento', requireRoles(ADMIN_ROLES), createEstablecimiento);
// LECTURA PÚBLICA: misión, visión y narrativa se muestran a clientes y visitantes.
router.get('/establecimiento/:id', getEstablecimiento);
router.get('/establecimiento', getEstablecimientoList);
router.patch('/establecimiento/:id', requireRoles(ADMIN_ROLES), updateEstablecimiento);
router.delete('/establecimiento/:id', requireRoles(ADMIN_ROLES), deleteEstablecimiento);

// Horarios
router.post('/horarios', requireRoles(ADMIN_ROLES), createHorario);
// LECTURA PÚBLICA: el horario de atención de la portada.
router.get('/horarios/:id', getHorario);
router.get('/horarios', getHorarios);
router.patch('/horarios/:id', requireRoles(ADMIN_ROLES), updateHorario);
router.delete('/horarios/:id', requireRoles(ADMIN_ROLES), deleteHorario);

// Ubicaciones
router.post('/ubicaciones', requireRoles(ADMIN_ROLES), createUbicacion);
// LECTURA PÚBLICA: dirección, teléfono y mapa del local.
router.get('/ubicaciones/:id', getUbicacion);
router.get('/ubicaciones', getUbicaciones);
router.patch('/ubicaciones/:id', requireRoles(ADMIN_ROLES), updateUbicacion);
router.delete('/ubicaciones/:id', requireRoles(ADMIN_ROLES), deleteUbicacion);

export default router;
