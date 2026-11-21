import { Router } from 'express';
import { createUser, getUser, getUsers, updateUser, deleteUser } from '../controllers/users.controllers.js';
import { requireRoles, requireSelfOrRoles } from '../middlewares/authorization.middleware.js';
import { ADMIN_ROLES } from '../config/roles.config.js';

// Crea una instancia de las rutas de Express
const router = Router();

// Crear Usuario
// 1. Registro Privado (lo realiza el Role: Administrador)
// El administrador podra asignar el rol que quiera
router.post('/', requireRoles(ADMIN_ROLES), createUser);

// Listado con paginación y filtro de estado mediante Query Strings
//   - GET /api/users                              (Por defecto: page=1, limit=15, state=all)
//   - GET /api/users?state=true | false | all
//   - GET /api/users?page=2&limit=5&state=all
// CAMBIO: antes un 'Cliente' podía listar a todos los usuarios; ahora es solo administración.
router.get('/', requireRoles(ADMIN_ROLES), getUsers);

// CAMBIO: Obtener y actualizar quedan para administración o para el propio usuario.
// Antes un 'Empleado' podía editar a cualquier usuario, incluido su propio rol.
router.get('/:id', requireSelfOrRoles(ADMIN_ROLES), getUser);
router.patch('/:id', requireSelfOrRoles(ADMIN_ROLES), updateUser);
// PUT reutiliza el mismo controlador: Mongoose valida cada campo enviado
router.put('/:id', requireSelfOrRoles(ADMIN_ROLES), updateUser);

// Eliminar un Usuario
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteUser);

// Exportar las rutas definidas en este archivo
export default router;
