import { Router } from 'express';
import { getUsers, getUserByEmail, updateUser, getUserProfile } from '../Controllers/users.controllers.js';
import authenticate from '../middlewares/authenticate.middleware.js';

const router = Router();

// Ahora la URL raíz /api/users te devolverá el usuario del token
router.get('/', authenticate, getUserProfile); 
router.get('/:email', authenticate, getUserByEmail);
router.put('/:email', authenticate, updateUser);

export default router;