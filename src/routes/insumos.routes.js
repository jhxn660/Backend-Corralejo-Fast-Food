import { Router } from "express";
import { createInsumo, deleteInsumo, getInsumo, getInsumos, updateInsumo } from "../controllers/insumos.controllers.js";
import { authMiddleware } from "../middlewares/authenticate.middleware.js";

const router = Router ();

// Se usa para que la ruta pueda funcionar

// router.post( '/', (req, res) => {
//     res.json({msg: 'Registra un produto'});
// });

router.post('/', authMiddleware, createInsumo);
router.get('/:id', authMiddleware, getInsumo);
router.get('/', authMiddleware, getInsumos);
router.patch('/:id', authMiddleware, updateInsumo);
router.delete('/:id', authMiddleware, deleteInsumo);

export default router;