import { Router } from 'express';

const router = Router();

// Definición de las rutas para los Usuarios.

// Obtener Usuarios
router.get('/', (req, res) => {
    res.json({ msg: 'Obtiene todos los usuarios' });
});

// Crear Usuario
router.post('/', (req, res) => {
    res.json({ msg: 'Registra Usuario' });
});

// Actualizar Totalmente
router.put('/', (req, res) => {
    res.json({ msg: 'Actualizar todas las propiedades de un usuario' });
});

// Actualizar Parcialmente
router.patch('/', (req, res) => {
    res.json({ msg: 'Actualizar una o mas propiedades del usuario' });
});

// Eliminar un Usuario
router.delete('/usuarios', (req, res) => {
    res.json({ msg: 'Elimina un Usuario' });
});

export default router;