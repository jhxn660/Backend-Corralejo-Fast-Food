import { Router } from 'express';

import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import {
    createProduct,
    getProduct,
    getProducts,
    getPublicProducts,
    updateProduct,
    setProductStatus,
    deleteProduct
} from '../controllers/products.controllers.js';

const router = Router();

// Pública (sin token): solo productos visibles. Va antes de '/:id' para que 'public' no se lea como ID.
router.get('/public', getPublicProducts);

router.post('/', requireRoles(ADMIN_ROLES), createProduct);
router.get('/', requireRoles(STAFF_ROLES), getProducts);
router.get('/:id', requireRoles(STAFF_ROLES), getProduct);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateProduct);
// Habilitar / deshabilitar (soft-toggle): { "status": boolean }
router.patch('/:id/status', requireRoles(ADMIN_ROLES), setProductStatus);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteProduct);

export default router;
