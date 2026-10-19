import { Router } from "express";
import { createInsumo, deleteInsumo, getInsumo, getInsumos, updateInsumo } from "../controllers/insumos.controllers.js";

const router = Router ();

// Se usa para que la ruta pueda funcionar

// router.post( '/', (req, res) => {
//     res.json({msg: 'Registra un produto'});
// });

router.post('/', createInsumo);
router.get('/:id', getInsumo);
router.get('/', getInsumos);
router.patch('/:id', updateInsumo);
router.delete('/:id', deleteInsumo);

export default router;