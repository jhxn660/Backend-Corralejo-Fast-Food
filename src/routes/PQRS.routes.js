import { Router } from 'express';
import { 
    createPQRS, 
    getPQRSList, 
    deletePQRS, 
    getPQRS, 
    updatePQRS 
} from '../controllers/PQRS.controllers.js';
import { validarJWT } from '../middlewares/validar-jwt.js'; // 1. Importar el middleware

const router = Router();

// 2. Agregar validarJWT para obligar al usuario a iniciar sesión al crear una PQRS
router.post('/', validarJWT, createPQRS);

router.get('/', getPQRSList);
router.delete('/:id', deletePQRS);
router.patch('/:id', updatePQRS);
router.get('/:id', getPQRS);

export default router;