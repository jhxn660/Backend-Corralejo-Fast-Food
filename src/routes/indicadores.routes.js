import { Router } from 'express';
import { CreateIndicadores, GetKpis, GetGoal, GetComparison, GetProductRows, GetRanking, GetReviews } from '../Controllers/indicadores.controllers.js';

const router = Router();

// Como el index.js ya pone "/api/indicadores", aquí solo ponemos "/"
router.post('/', CreateIndicadores); 

// Las rutas GET heredarán la misma base
router.get('/kpis', GetKpis);
router.get('/goal', GetGoal);
router.get('/comparison', GetComparison);
router.get('/productRows', GetProductRows);
router.get('/ranking', GetRanking);
router.get('/reviews', GetReviews);

export default router;