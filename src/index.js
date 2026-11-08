
import express from 'express';  
import conexion from './config/mongo.config.js';  // Conexion a la base de datos
import categoriesRoute from './routes/categories.routes.js';
import productRoute from './routes/products.routes.js';
import PedidosRoute from './routes/pedidos.routes.js';
import ventasRoute from './routes/ventas.routes.js';
import indicadoresRoute from './routes/indicadores.routes.js';
import authRoute from './routes/auth.routes.js'
import usersRoute from './routes/users.routes.js';
import comentarioRoute from './routes/comentario.routes.js';
import pqrsRoute from './routes/pqrs.routes.js';
import informacionRoute from './routes/informacion.routes.js';

const port = process.env.PORT || 3001;

const app = express();    // Instancia de express

conexion();   // Ejecuta la conexion a la base de datos

// Habilita a la app para comprender objetos JSON
app.use(express.json() );

// Definiendo 1 endpoint (ruta de entrada)
app.get('/health', (req, res) => {
  res.json({msg: 'Apartado CFF - Corralejo Fast Food panel menu compuesto Funcionado a la perfección!'});
});

// Enlazar todas las rutas de la app
app.use( '/api/categories', categoriesRoute );
app.use( '/api/products', productRoute);
app.use( '/api/auth', authRoute);
app.use( '/api/users', usersRoute );


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
app.use('/api/comentario', comentarioRoute);
app.use('/api/pqrs', pqrsRoute);
app.use('/api', informacionRoute);

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});