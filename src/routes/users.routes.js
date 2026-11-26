import { Router } from 'express';

import { ADMIN_ROLES } from '../config/roles.config.js';
import { requireRoles, requireSelfOrRoles } from '../middlewares/authorization.middleware.js';
import { createUser, getUser, getUsers, updateUser, deleteUser } from '../controllers/users.controllers.js';

const router = Router();

// Crear usuario (registro privado): la administración asigna el rol.
router.post('/', requireRoles(ADMIN_ROLES), createUser);

// Listado con paginación y filtro de estado mediante Query Strings
//   - GET /api/users                              (Por defecto: page=1, limit=15, status=all)
//   - GET /api/users?status=true | false | all
//   - GET /api/users?page=2&limit=5&status=all
router.get('/', requireRoles(ADMIN_ROLES), getUsers);

// Obtener y actualizar: la administración o el propio usuario.
router.get('/:id', requireSelfOrRoles(ADMIN_ROLES), getUser);
router.patch('/:id', requireSelfOrRoles(ADMIN_ROLES), updateUser);
// PUT reutiliza el mismo controlador: Mongoose valida cada campo enviado

// Dar de baja (baja lógica). A un Administrador solo lo da de baja el Owner (ver deleteUser).
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteUser);

export default router;
