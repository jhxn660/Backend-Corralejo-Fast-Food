import { Router } from 'express';
import { CreateIndicators, GetKpis, GetGoal, GetComparison, GetProductRows, GetRanking, GetReviews } from '../controllers/indicators.controllers.js';
import { authMiddleware } from '../middlewares/authenticate.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';

const router = Router();

router.post('/', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], CreateIndicators);

// Una ruta por widget del dashboard: cada una devuelve solo su sección del reporte vigente
router.get('/kpis', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], GetKpis);
router.get('/goal', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], GetGoal);
router.get('/comparison', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], GetComparison);
router.get('/productRows', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], GetProductRows);
router.get('/ranking', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], GetRanking);
router.get('/reviews', [ authMiddleware, authorizationMiddleware([ 'Administrador' ]) ], GetReviews);

export default router;
