import { Router } from 'express';
import { createUser } from '../controllers/users.controllers.js';
import { loginUser, verifyAuthenticate } from '../controllers/auth.controllers.js'

// Crea una instancia de las rutas de express
const router = Router();

// Registro publico de usuarios
router.post('/register', createUser);

// Login de usuarios
router.post('/login', loginUser);

// Renovacion de credenciales (Token)
router.get('/renew-token', verifyAuthenticate);

// Recuperar contraseña
// Habilitar cuenta registrada publicamente


// Exportar las rutas definidas en este archivo
export default router;