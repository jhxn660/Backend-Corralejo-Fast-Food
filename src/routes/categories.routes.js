import { Router } from 'express';

import { ADMIN_ROLES, STAFF_ROLES } from '../config/roles.config.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { createCategory, getCategory, getCategories, updateCategory, deleteCategory } from '../controllers/categories.controllers.js';

/**
 * CAPA DE RUTAS. Un archivo de rutas solo responde "¿quién atiende esta URL?"; no tiene lógica.
 * Cada línea se lee de izquierda a derecha y Express ejecuta las piezas en ese orden:
 *
 *   router.MÉTODO( ruta, [middlewares de acceso], controlador )
 *
 * requireRoles(ROLES) devuelve [autenticar, autorizar]: si alguno responde 401/403, la petición
 * se corta ahí y el controlador nunca se ejecuta. El prefijo '/api/categories' lo pone app.js,
 * por eso aquí las rutas empiezan en '/'.
 */
const router = Router();

router.post('/', requireRoles(ADMIN_ROLES),  createCategory);
router.get('/', requireRoles(STAFF_ROLES), getCategories);
router.get('/:id', requireRoles(STAFF_ROLES), getCategory);
router.patch('/:id', requireRoles(ADMIN_ROLES), updateCategory);
router.delete('/:id', requireRoles(ADMIN_ROLES), deleteCategory);

export default router;
