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
router.post('/', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador' ]) ], createUser);


// Obtener Usuarios
router.get('/', [ authMiddleware, authorizationMiddleware(['Owner', 'Administrador' ]) ], getUsers);

// Actualizar Totalmente
router.put('/', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador' ]) ], updatePUser);

// Obtener Usuario
router.get('/:id', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador' ]) ], getUser);

// Actualizar Parcialmente
router.patch('/:id', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador', 'Empleado' ]) ], updateMPUser);

// Eliminar un Usuario
router.delete('/:id', [ authMiddleware, authorizationMiddleware([ 'Owner', 'Administrador' ]) ], deleteUser);

// Exportar las rutas definidas en este archivo
export default router;