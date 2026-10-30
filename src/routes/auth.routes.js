import { Router } from 'express';
import { createUser } from '../controllers/users.controllers.js';
import { loginUser, verifyAuthenticate } from '../controllers/auth.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';
import withoutRoleMiddleware from '../middlewares/without-role.middleware.js';

// Crea una instancia de las rutas de Express
const router = Router();

// Define las rutas para la autenticacion

// 1. Registro publico de usuarios. [Usuario]
// Aplicar Middleware para que solo se registre el Customer
router.post('/register', withoutRoleMiddleware, createUser);

// 2. Login de Usuarios
router.post('/login', loginUser);

// 3. Renovacion de Credenciales (token)
router.get('/renew-token', authMiddleware, // authorizationMiddleware, 
verifyAuthenticate);

// 4. Recuperar contraseña
// 5. Habilitar cuenta registrada publicamente

// Exportar las rutas definidas en este archivo
export default router;