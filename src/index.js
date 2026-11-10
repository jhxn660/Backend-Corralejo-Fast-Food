import express from 'express';

import conexion from './config/mongo.config.js';
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

const port = process.env.PORT || 3001;

const app = express();

// La conexión se lanza sin await: Mongoose encola las consultas hasta que el
// driver esté listo, así el servidor HTTP no depende del tiempo de arranque de Mongo.
conexion();

app.use(express.json());

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

// Operación comercial
app.use('/api/orders', ordersRoute);
app.use('/api/sales', salesRoute);
app.use('/api/indicators', indicatorsRoute);

// Atención al cliente
app.use('/api/comments', commentsRoute);
app.use('/api/pqrs', pqrsRoute);

// Este router agrupa tres recursos (/establecimiento, /horarios, /ubicaciones),
// por eso se monta en la raíz de /api y cada ruta declara su propio prefijo.
app.use('/api', establecimientoRoute);

app.listen(port, () => {
    console.log(`Servidor está corriendo en http://localhost:${port}`);
});
