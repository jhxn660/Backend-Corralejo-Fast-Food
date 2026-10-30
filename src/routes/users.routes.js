import { Router } from 'express';
import { createUser, getUser, getUsers, updatePUser, updateMPUser, deleteUser } from '../controllers/users.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// Define las rutas para los Usuarios

// Crear Usuario
// 1. Registro Privado (lo realiza el Role: Administrador)
// El administrador podra asignar el rol que quiera
router.post('/', [ authMiddleware, authorizationMiddleware ], createUser);

// Obtener Usuario
router.get('/:id', authMiddleware, getUser);

// Obtener Usuarios
router.get('/', authMiddleware, getUsers);

// Actualizar Totalmente
router.put('/', authMiddleware, updatePUser);

// Actualizar Parcialmente
router.patch('/:id', authMiddleware, updateMPUser);

// Eliminar un Usuario
router.delete('/:id', authMiddleware, deleteUser);

// Exportar las rutas definidas en este archivo
export default router;