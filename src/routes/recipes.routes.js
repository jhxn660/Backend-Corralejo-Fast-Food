import { Router } from 'express';

import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { createRecipe, getRecipes, getRecipe, updateRecipe, deleteRecipe } from '../controllers/recipes.controllers.js';

// Recetas de los productos: qué insumos gasta cada uno (descuentan inventario al vender).
// CRUD completo para la administración (Owner y Administrador); el Empleado solo las lee.
const router = Router();

router.post('/', requireRoles(ADMIN_ROLES), createRecipe);
router.get('/', requireRoles(STAFF_ROLES), getRecipes);
router.get('/:id', requireRoles(STAFF_ROLES), getRecipe);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateRecipe);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteRecipe);

export default router;
