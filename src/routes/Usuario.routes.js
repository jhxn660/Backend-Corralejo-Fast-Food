import { Router } from 'express';
import { crearUsuario, loginUsuario } from '../controllers/Usuario.controllers.js';

const router = Router();

router.post('/new', crearUsuario);
router.post('/', loginUsuario);

export default router;