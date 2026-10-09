import { Router } from 'express';
import { listmenu, createmenu, updatemenu, updattemenu, deletemenu} from '../controllers/menu.controllers.js'

const router = Router();

// Definicion de las rutas para usuarios
router.get('/', listmenu);
router.post('/', createmenu);
router.put('/', updatemenu);
router.patch('/', updattemenu);
router.delete('/', deletemenu)

export default router;