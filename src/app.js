import express from 'express';
import cors from 'cors';

import authRoute from './routes/auth.routes.js';
import usersRoute from './routes/users.routes.js';
import categoriesRoute from './routes/categories.routes.js';
import productRoute from './routes/products.routes.js';
import suppliesRoute from './routes/supplies.routes.js';
import ordersRoute from './routes/orders.routes.js';
import salesRoute from './routes/sales.routes.js';
import indicatorsRoute from './routes/indicators.routes.js';
import commentsRoute from './routes/comments.routes.js';
import pqrsRoute from './routes/pqrs.routes.js';
import establecimientoRoute from './routes/establecimiento.routes.js';
import { ensureBody, rejectMongoOperators } from './middlewares/body.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

/**
 * Composición de la aplicación Express. Aquí solo se ARMA (qué middlewares y qué rutas, y en qué
 * orden); quien la ARRANCA es index.js. Separarlo permite que las pruebas importen `app` y la
 * levanten contra un MongoDB en memoria, sin abrir el puerto real ni conectar a Atlas.
 *
 * El orden de los app.use() ES el recorrido de cada petición, de arriba hacia abajo:
 *   1. Globales: CORS → parseo del JSON → preparación del body.
 *   2. Rutas: la primera que coincide con método + URL atiende la petición.
 *   3. notFoundHandler: nadie la atendió → 404.
 *   4. errorHandler: alguien llamó a next(error) → respuesta de error. Siempre va el último.
 */
const app = express();

// CORS_ORIGIN = lista separada por comas (p. ej. http://localhost:5173,https://midominio.com).
// Solo esos orígenes pueden llamar a la API desde un navegador. Sin definir, se admite cualquiera
// (cómodo en desarrollo, inseguro en producción: por eso se avisa en consola).
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];

if (!allowedOrigins.length) {
    console.warn('CORS_ORIGIN no está definido: la API acepta peticiones de cualquier origen');
}

app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json());
app.use(ensureBody);
app.use(rejectMongoOperators);

app.get('/health', (req, res) => {
    res.status(200).json({ msg: 'Servidor de Corralejo Fast Food Funcionando!' });
});

// Acceso y usuarios
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);

// Catálogo e inventario
app.use('/api/categories', categoriesRoute);
app.use('/api/products', productRoute);
app.use('/api/supplies', suppliesRoute);

// Operación comercial: Pedido ──▶ Venta ──▶ Indicadores
app.use('/api/orders', ordersRoute);
app.use('/api/sales', salesRoute);
app.use('/api/indicators', indicatorsRoute);

// Atención al cliente
app.use('/api/comments', commentsRoute);
app.use('/api/pqrs', pqrsRoute);

// Este router agrupa tres recursos (/establecimiento, /horarios, /ubicaciones),
// por eso se monta en la raíz de /api y cada ruta declara su propio prefijo.
app.use('/api', establecimientoRoute);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
