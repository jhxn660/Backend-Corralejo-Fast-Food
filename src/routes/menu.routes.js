import { Router } from 'express';

const router = Router();

// Definicion de las rutas para usuarios
router.get('/', (req, res) => {
    res.send('Listar todas las categorias')
});

router.post('/', (req, res) => {
    res.send('Registra categoria')
});

router.put('/', (req, res) => {
  res.send('Actualizar todas las categorias')
});

router.patch('/', (req, res) => {
  res.send('Actualizar una o mas categorias del menu')
});

router.delete('/', (req, res) => {
  res.send('Eliminar menu')
});

export default router;