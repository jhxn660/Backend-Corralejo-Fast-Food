import { Router } from 'express';
import { deleteUsuario, updateMPUsuario, updatePUsuario, createUsuario, getUsuario, getUsuarios } from '../controllers/usuarios.controllers.js';
import { authMiddleware } from "../middlewares/authenticate.middleware.js";

const router = Router();

// Definición de las rutas para los Usuarios.

// Crear Usuario
router.post('/', authMiddleware, createUsuario); // 1. Registro Privado(Lo realiza el Role: Administrador). = El administrador podra asignar el rol que quiera
// Obtener Usuario
router.get('/:id', authMiddleware, getUsuario);
//Obtener Usuarios
router.get('/', authMiddleware, getUsuarios);
// Actualizar Totalmente
router.put('/', authMiddleware, updatePUsuario);
// Actualizar Parcialmente
router.patch('/:id', authMiddleware, updateMPUsuario);
// Eliminar un Usuario
router.delete('/:id', authMiddleware, deleteUsuario);

export default router;