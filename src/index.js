// const express = require('express');   //CommonJS
import express from 'express';  
import conexion from './config/mongo.config.js';  // Conexion a la base de datos
import menuRoute from './routes/menu.routes.js';
import categoriesRoute from './routes/categories.routes.js';
import productRoute from './routes/products.routes.js';
import authRoute from './routes/auth.routes.js'

const port = process.env.PORT || 3001;

const app = express();    // Instancia de express

conexion();   // Ejecuta la conexion a la base de datos

// Habilita a la app para comprender objetos JSON
app.use(express.json() );

// Definiendo 1 endpoint (ruta de entrada)
app.get('/healt', (req, res) => {
  res.json({msg: 'Apartado CFF - Corralejo Fast Food panel menu compuesto Funcionado a la perfección!'});
});

// Enlazar todas las rutas de la app
app.use( '/api/menu', menuRoute );
app.use( '/api/categories', categoriesRoute );
app.use( '/api/products', productRoute);
app.use( '/api/auth', authRoute);


//Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});