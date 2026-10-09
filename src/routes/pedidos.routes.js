import { Router } from 'express';

const router = Router();

//Definicion de las rutas para pedidos
router.get('/', (req, res) => {
    res.send('Obtener pedidos Está Funcionando!!')
})
router.post('/', (req, res) => {
    res.send('Registra un pedido!!')
})
router.put('/', (req, res) => {
    res.send('Actualiza todas las propiedades de un pedido!!')
})
router.patch('/', (req, res) => {
    res.send('Actualiza una o mas propiedades de un pedido!!')
})
router.delete('/', (req, res) => {
    res.send('Elimina un pedido!!')
})

export default router;