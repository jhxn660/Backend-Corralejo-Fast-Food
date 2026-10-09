import { Router } from 'express';
import { listarmenu, createmenu, updatemenu, updattemenu, deletemenu} from '../controllers/users.controllers.js'

const router = Router();

// Definicion de las rutas para usuarios
router.get('/', listarmenu);
router.post('/', createmenu);
router.put('/', updatemenu);
router.patch('/', updattemenu);
router.delete('/', deletemenu)

export default router;