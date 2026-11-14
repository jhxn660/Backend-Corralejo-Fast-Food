import { Router } from 'express';
import { createCategory, getCategory, getCategories, updateCategory, deleteCategory } from '../controllers/categories.controllers.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';

// Crea una instancia de las rutas de Express
const router = Router();

// '/', Ruta. []. Lista de Controla
// Define las rutas para las categorias
router.post('/', requireRoles(ADMIN_ROLES),  createCategory);
router.get('/', requireRoles(STAFF_ROLES), getCategories);
router.get('/:id', requireRoles(STAFF_ROLES), getCategory);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateCategory);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteCategory);

// Exportar las rutas definidas en este archivo
export default router;
