import { Router } from 'express';
import { createUser, getUser, getUsers, updateMPUser, deleteUser } from '../controllers/users.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// Define las rutas para los Usuarios

// Crear Usuario
// 1. Registro Privado (lo realiza el Role: Administrador)
// El administrador podra asignar el rol que quiera
router.post('/', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador' ]) ], createUser);

// Ruta GET con soporte para paginación y filtro de estado mediante Query Strings
// Ejemplos de consumo:
//   - GET /api/users                              (Por defecto: page=1, limit=15, state=all)
//   - GET /api/users?state=true                   (Solo usuarios activos)
//   - GET /api/users?state=false                  (Solo usuarios inactivos)
//   - GET /api/users?state=all                    (Todos los usuarios sin distingo de estado)
//   - GET /api/users?page=2&limit=5&state=all     (Paginado combinado con filtro de estado)
// Obtener Usuarios
router.get('/', [ authMiddleware, authorizationMiddleware(['Owner', 'Administrador', 'Cliente' ]) ], getUsers);

// Obtener Usuario
router.get('/:id', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador', 'Cliente' ]) ], getUser);

// Actualizar Parcialmente
router.patch('/:id', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador', 'Empleado' ]) ], updateMPUser);

// Actualizar Todas las Propiedades
// CAMBIO: Bruno ya tenía esta petición pero la ruta no existía (404). Reutiliza el mismo
// controlador: Mongoose valida cada campo enviado y la contraseña se descarta igual que en PATCH.
router.put('/:id', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador', 'Empleado' ]) ], updateMPUser);

// Eliminar un Usuario
router.delete('/:id', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador' ]) ], deleteUser);

// Exportar las rutas definidas en este archivo
export default router;
