import { Router } from "express";
import { createUsuario } from "../controllers/usuarios.controllers.js";
import { loginUser, verifyAuthenticate } from "../controllers/auth.controllers.js";
import { authMiddleware } from "../middlewares/authenticate.middleware.js";
import { authorizationMiddleware } from "../middlewares/authorization.middleware.js";

// Crea una instancia de las rutas de Express
const router = Router();

// Define las rutas para la autenticación
// 1. Registro público de usuarios. [Usuario]
// Aplicar Middleware para que solo se registre el Customer.
router.post( '/register', createUsuario );

// 2. Login de Usuarios.
router.post ( '/login', loginUser );

// 3. Renovación de Credenciales (token)
router.get( '/renew-token', authMiddleware, authorizationMiddleware, verifyAuthenticate );

// 4. Recuperar contraseña.
// 5. Habilitar cuenta registrada publicamente.

// Exportar las rutas definidas en este archivo.
export default router;