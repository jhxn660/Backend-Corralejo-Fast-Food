import { Router } from 'express';
import { CreateVentas, GetVentas, UpdateAllVentas, UpdatePartialVentas, DeleteVentas } from '../Controllers/ventas.controllers.js';

const router = Router();

router.get('/', GetVentas);
router.post('/', CreateVentas);
router.put('/', UpdateAllVentas);
router.patch('/', UpdatePartialVentas);
router.delete('/', DeleteVentas);

export default router;