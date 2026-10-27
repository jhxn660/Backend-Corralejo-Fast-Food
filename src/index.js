// const express = require('express');   //CommonJS
import express from 'express';     //ESModule

import conexion from './config/mongo.config.js';
import PedidosRoute from './routes/pedidos.routes.js';
import ventasRoute from './routes/ventas.routes.js';
import indicadoresRoute from './routes/indicadores.routes.js';

const port = process.env.PORT || 3000; // Puerto del servidor

const app = express();

conexion(); // Conectar a la base de datos

app.use(express.json() ); // Habilita a la aplicación para interpretar datos en formato JSON


// Definiendo 1 endpoint (ruta de entrada)
app.get('/health', (req, res) => {
  res.send('Servidor del Corralejo Está Funcionando!!')
});

//Enlazar rutas de pedidos
app.get( '/api/pedidos', PedidosRoute);


//Enlazar todas las rutas de la aplicación
app.use('/api/pedidos', PedidosRoute);
app.use('/api/ventas', ventasRoute);
app.use('/api/indicadores', indicadoresRoute);


//Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});
