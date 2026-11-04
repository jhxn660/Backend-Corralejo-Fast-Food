import { Router } from 'express';

import { 
    createInformacion, 
    getInformacionList, 
    deleteInformacion, 
    getInformacion, 
    updateInformacion,
    createHorario, 
    getHorarios, 
    deleteHorario, 
    getHorario, 
    updateHorario,
    createUbicacion, 
    getUbicaciones, 
    deleteUbicacion, 
    getUbicacion, 
    updateUbicacion 
} from '../controllers/Informacion.controllers.js';

const router = Router();

// RUTA INFORMACIÓN
router.post('/informacion', createInformacion);
router.get('/informacion', getInformacionList);
router.delete('/informacion/:id', deleteInformacion);
router.patch('/informacion/:id', updateInformacion);
router.get('/informacion/:id', getInformacion);

// RUTA HORARIOS
router.post('/horarios', createHorario);
router.get('/horarios', getHorarios);
router.delete('/horarios/:id', deleteHorario);
router.patch('/horarios/:id', updateHorario);
router.get('/horarios/:id', getHorario);

// RUTA UBICACIÓN
router.post('/ubicaciones', createUbicacion);
router.get('/ubicaciones', getUbicaciones);
router.delete('/ubicaciones/:id', deleteUbicacion);
router.patch('/ubicaciones/:id', updateUbicacion);
router.get('/ubicaciones/:id', getUbicacion);

export default router;