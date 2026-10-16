import { Router } from 'express';
import { getmenu, createmenu, updatemenu, updattemenu, deletemenu} from '../controllers/menu.controllers.js'

const router = Router();

// Definicion de las rutas para usuarios
router.get('/', getmenu);
router.post('/', createmenu);
router.put('/', updatemenu);
router.patch('/', updattemenu);
router.delete('/', deletemenu)

export default router;