import { Router } from 'express';

import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import withoutRoleMiddleware from '../middlewares/without-role.middleware.js';
import { loginUser, verifyAuthenticate } from '../controllers/auth.controllers.js';
import { createUser } from '../controllers/users.controllers.js';

const router = Router();

// 1. Registro publico: el visitante ('Usuario') pasa a ser 'Cliente', rol que habilita el modulo de PQRS.
// withoutRoleMiddleware fuerza ese rol e ignora cualquier otro que venga en el body.
router.post('/register', withoutRoleMiddleware, createUser);

// 2. Login de Usuarios
router.post('/login', loginUser);

// 3. Renovacion de Credenciales (token)
router.get('/renew-token', authMiddleware, verifyAuthenticate);

// Pendiente: 4. recuperar contraseña · 5. habilitar una cuenta registrada públicamente.

export default router;
