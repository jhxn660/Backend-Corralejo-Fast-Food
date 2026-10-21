// const express = require('express');   //CommonJS
import express from 'express';           //ESModule
import conexion from './config/mongo.config.js'; // Conexion a la base de datos
import usuarioRoute from './routes/usuarios.routes.js';
import categoriesRoute from './routes/categories.routes.js';
import insumosRoute from './routes/insumos.routes.js';

const port = process.env.PORT || 3001;

const app = express(); // Instancia de Express

conexion(); // Ejecuta la conexion a la base de datos

//Carga la aplicación. Habilita a la aplicación para interpretar JSON
app.use( express.json());

// Definiendo 1 endpoint (ruta Entrada)
app.get('/usuend', (req, res) => {
  res.status(200).json({ msg: 'Servidor de Usuarios Funcionando!' });
});

// Enlazar todas las rutas de aplicación
app.use('/api/usuarios', usuarioRoute);
app.use('/api/categories', categoriesRoute);
app.use('/api/insumos', insumosRoute);

//Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});
