import { Router } from 'express';
import { deleteUsuario, updateMPUsuario, updatePUsuario, createUsuario, getUsuario, getUsuarios } from '../controllers/usuarios.controllers.js';

const router = Router();

// Definición de las rutas para los Usuarios.

// Crear Usuario
router.post('/', createUsuario); // 1. Registro Privado(Lo realiza el Role: Administrador). = El administrador podra asignar el rol que quiera
// Obtener Usuario
router.get('/:id', getUsuario);
//Obtener Usuarios
router.get('/', getUsuarios);
// Actualizar Totalmente
router.put('/', updatePUsuario);
// Actualizar Parcialmente
router.patch('/:id', updateMPUsuario);
// Eliminar un Usuario
router.delete('/:id', deleteUsuario);

export default router;