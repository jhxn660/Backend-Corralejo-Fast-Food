import { Router } from 'express';
import {
    createComment,
    getComment,
    getComments,
    updateComment,
    deleteComment
} from '../controllers/comments.controllers.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

const router = Router();

// CONDICIÓN ESPECIAL: comentar no exige sesión. Pueden hacerlo un 'Cliente' autenticado o un
// visitante sin cuenta ('Usuario'); lo que habilita el comentario es el QR del ticket, que valida
// el controlador (incluido el rol). Por eso esta ruta usa optionalAuthMiddleware y NO lleva
// authMiddleware ni authorizationMiddleware: exigirlos bloquearía al visitante anónimo.
router.post('/', optionalAuthMiddleware, createComment);

// El resto son operaciones de gestión/moderación: requieren sesión y rol autorizado.
router.get('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getComment);
router.get('/', [ authMiddleware, authorizationMiddleware([ 'Administrador', 'Empleado' ]) ], getComments);
router.patch('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], updateComment);
router.delete('/:id', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], deleteComment);

export default router;
