import { Router } from 'express'
import { createProduct, getProducts, deleteProduct, getProduct, updateProduct } from '../controllers/products.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js'

// Crea una instancia de las rutas de Express
const router = Router();

// CAMBIO: los roles se alinean con el enum del modelo User ('Administrador', 'Empleado').
// Antes se usaban 'ADMIN' y 'EMPLEADO', que ningún usuario tiene, y todas estas rutas respondían 403.
// Define las rutas para los productos
router.post( '/', [ authMiddleware, authorizationMiddleware(['Administrador']) ], createProduct);
router.get( '/', [ authMiddleware, authorizationMiddleware(['Administrador', 'Empleado']) ], getProducts);
router.delete( '/:id', [ authMiddleware, authorizationMiddleware(['Administrador']) ], deleteProduct);
router.patch( '/:id', [ authMiddleware, authorizationMiddleware(['Administrador']) ], updateProduct);
router.get( '/:id', [ authMiddleware, authorizationMiddleware(['Administrador']) ], getProduct)

// Exportar las rutas definidas en este archivo
export default router;
