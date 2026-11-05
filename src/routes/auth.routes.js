import { Router } from 'express';
import { createUser } from '../controllers/users.controllers.js';

import withoutRoleMiddleware from '../middlewares/without-role.middleware.js';
import { loginUser, verifyAuthenticate } from '../Controllers/auth.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';

// Crea una instancia de las rutas de express
const router = Router();

// Registro publico de usuarios
router.post('/register', withoutRoleMiddleware, createUser);

// Login de usuarios
router.post('/login', loginUser);

// Renovacion de credenciales (Token)
router.get('/renew-token', authMiddleware, verifyAuthenticate);

// Recuperar contrasena
// Habilitar cuenta registrada publicamente


// Exportar las rutas definidas en este archivo
export default router;