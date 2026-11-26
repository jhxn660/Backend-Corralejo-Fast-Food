import { Router } from 'express';

import { ROLES, ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';
import { optionalAuthMiddleware } from '../middlewares/authenticate.middleware.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import {
    createComment,
    getComment,
    getComments,
    getPublicComments,
    updateComment,
    setCommentStatus,
    deleteComment,
    likeComment,
    unlikeComment
} from '../controllers/comments.controllers.js';

const router = Router();

// "Me gusta": solo cuentas a las que atribuirlo y que ven el muro de opiniones (Owner,
// Administrador y Cliente). Un visitante sin token no tiene identidad: no puede darlo.
const LIKE_ROLES = Object.freeze([ ...ADMIN_ROLES, ROLES.CLIENT ]);

// CONDICIÓN ESPECIAL: comentar no exige sesión. Pueden hacerlo un 'Cliente' autenticado o un
// visitante sin cuenta ('Usuario'); lo que habilita el comentario es el QR del ticket, que valida
// el controlador (incluido el rol). Por eso esta ruta usa optionalAuthMiddleware.
router.post('/', optionalAuthMiddleware, createComment);

// Pública: solo comentarios visibles. Va antes de '/:id'. No exige token, pero si llega uno
// válido (optionalAuthMiddleware) cada comentario dice si esa persona ya le dio "me gusta".
router.get('/public', optionalAuthMiddleware, getPublicComments);

// "Me gusta": POST lo da y DELETE lo quita. Repetir cualquiera de los dos no cambia el contador.
router.post('/:id/like', requireRoles(LIKE_ROLES), likeComment);
router.delete('/:id/like', requireRoles(LIKE_ROLES), unlikeComment);

// El resto son operaciones de gestión/moderación: requieren sesión y rol autorizado.
router.get('/', requireRoles(STAFF_ROLES), getComments);
router.get('/:id', requireRoles(STAFF_ROLES), getComment);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateComment);
// Mostrar / ocultar (soft-toggle): { "status": boolean }
router.patch('/:id/status', requireRoles(ADMIN_ROLES), setCommentStatus);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteComment);

export default router;
