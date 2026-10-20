import { Router } from 'express';
import { deleteUsuario, updateMPUsuario, updatePUsuario, createUsuario, getUsuario } from '../controllers/usuarios.controllers.js';

const router = Router();

// Definición de las rutas para los Usuarios.

// Crear Usuario
router.post('/', createUsuario);
// Obtener Usuarios
router.get('/:id', getUsuario);
// Actualizar Totalmente
router.put('/', updatePUsuario);
// Actualizar Parcialmente
router.patch('/', updateMPUsuario);
// Eliminar un Usuario
router.delete('/', deleteUsuario);

export default router;