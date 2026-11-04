import { Router } from 'express';
import { 
    createComentario, 
    getComentarios, 
    deleteComentario, 
    getComentario, 
    updateComentario 
} from '../controllers/Comentario.controllers.js';
import { validarJWT } from '../middlewares/validar-jwt.js'; // 1. Importar el middleware


const router = Router();

// 2. Agregar validarJWT aquí. Si no hay token válido, Express detiene la petición.
router.post('/', validarJWT, createComentario);

router.get('/', getComentarios);
router.delete('/:id', deleteComentario);
router.patch('/:id', updateComentario);
router.get('/:id', getComentario);

export default router;