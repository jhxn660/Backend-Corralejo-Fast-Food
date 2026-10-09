// const express = require('express');   //CommonJS
import express from 'express';  

import menuRoute from './routes/menu.routes.js'

const app = express();

// Definiendo 1 endpoint (ruta de entrada)
app.get('/healt', (req, res) => {
  res.send('Apartado CFF - Corralejo Fast Food panel menu compuesto Funcionado a la perfección!')
});

// Enlazar todas las rutas de la app
app.use( '/api/menu', menuRoute );

//Iniciar servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});