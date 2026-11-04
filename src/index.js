import express from 'express';
import conexion from './config/mongo.config.js';
import PedidosRoute from './routes/pedidos.routes.js';
import ventasRoute from './routes/ventas.routes.js';
import indicadoresRoute from './routes/indicadores.routes.js';
import authRoute from './routes/auth.routes.js'; // NUEVO
import usersRoute from './routes/users.routes.js'; // NUEVO

const port = process.env.PORT || 3000;

const app = express();

conexion(); 

app.use(express.json()); 

app.get('/health', (req, res) => {
  res.send('Servidor del Corralejo Está Funcionando!!');
});

// Enlazar todas las rutas de la aplicación
app.use('/api/pedidos', PedidosRoute);
app.use('/api/ventas', ventasRoute);
app.use('/api/indicadores', indicadoresRoute);
app.use('/api/auth', authRoute);   // NUEVO
app.use('/api/users', usersRoute); // NUEVO

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});