// const express = require('express');   //CommonJS
import express from 'express';     //ESModule

import PedidosRoute from './routes/pedidos.routes.js';



const app = express();


// Definiendo 1 endpoint (ruta de entrada)
app.get('/health', (req, res) => {
  res.send('Servidor del Corralejo Está Funcionando!!')
});

//Enlazar todas las rutas de la aplicación
app.use('/api/pedidos', PedidosRoute);

//Iniciar servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});
