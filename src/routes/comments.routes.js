import { Router } from 'express';
import {
    createComment,
    getComment,
    getComments,
    getPublicComments,
    updateComment,
    setCommentStatus,
    toggleCommentLike,
    deleteComment
} from '../controllers/comments.controllers.js';
import { optionalAuthMiddleware } from '../middlewares/authenticate.middleware.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { ROLES, ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';

const router = Router();

// CONDICIÓN ESPECIAL: comentar no exige sesión. Pueden hacerlo un 'Cliente' autenticado o un
// visitante sin cuenta ('Usuario'); lo que habilita el comentario es el QR del ticket, que valida
// el controlador (incluido el rol). Por eso esta ruta usa optionalAuthMiddleware.
router.post('/', optionalAuthMiddleware, createComment);

// Pública (sin token): solo comentarios visibles. Va antes de '/:id'.
// Con sesión opcional: si viene el token, cada comentario dice si ESE usuario ya le dio me gusta.
router.get('/public', optionalAuthMiddleware, getPublicComments);

// "Me gusta": suma o resta 1 al contador del comentario. Lo pueden dar Cliente, Administrador y Owner.
router.patch('/:id/like', requireRoles([ ROLES.CLIENT, ...ADMIN_ROLES ]), toggleCommentLike);

// El resto son operaciones de gestión/moderación: requieren sesión y rol autorizado.
router.get('/', requireRoles(STAFF_ROLES), getComments);
router.get('/:id', requireRoles(STAFF_ROLES), getComment);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateComment);
// Mostrar / ocultar (soft-toggle): { "isActive": boolean }
router.patch('/:id/status', requireRoles(ADMIN_ROLES), setCommentStatus);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteComment);

export default router;
