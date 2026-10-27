import { Router } from 'express';
import { CreatePedidos, GetPedidos, UpdateAllPedidos, UpdatePartialPedidos, DeletePedidos } from '../Controllers/pedidos.controllers.js';

const router = Router();

//Definicion de las rutas para pedidos
router.get('/', GetPedidos);
router.post('/', CreatePedidos);
router.put('/', UpdateAllPedidos);
router.patch('/', UpdatePartialPedidos);
router.delete('/', DeletePedidos);

export default router;