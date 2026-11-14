import { Router } from 'express';
import {
    getPanel,
    getDashboard,
    getKpis,
    getGoal,
    getComparison,
    getProductRows,
    getRanking,
    getReviews,
    getMetrics,
    setGoal,
    rebuildIndicators
} from '../controllers/indicators.controllers.js';
import { requireRoles } from '../middlewares/authorization.middleware.js';
import { ADMIN_ROLES } from '../config/roles.config.js';

// Los indicadores NO se crean a mano: se consolidan solos con cada venta (ver sales.services).
const router = Router();

const adminOnly = requireRoles(ADMIN_ROLES);

// Pantalla actual de Indicadores del Frontend (?month, compareA, compareB, yearA, yearB)
router.get('/panel', adminOnly, getPanel);

// Formato del dashboard anterior (?date=YYYY-MM-DD, por defecto hoy)
router.get('/dashboard', adminOnly, getDashboard);

// Una ruta por widget (?date=YYYY-MM-DD)
router.get('/kpis', adminOnly, getKpis);
router.get('/goal', adminOnly, getGoal);
router.get('/comparison', adminOnly, getComparison);
router.get('/productRows', adminOnly, getProductRows);
router.get('/ranking', adminOnly, getRanking);
router.get('/reviews', adminOnly, getReviews);

// ?from&to&compare=previous_period|previous_year|custom|none&compareFrom&compareTo&groupBy=day|month&top
router.get('/metrics', adminOnly, getMetrics);

router.put('/goal/:year', adminOnly, setGoal);
router.post('/rebuild', adminOnly, rebuildIndicators);

export default router;
