// const express = require('express');   //CommonJS
import express from 'express';           //ESModule
import usuarioRoute from './routes/usuarios.routes.js';

const app = express();

// Definiendo 1 endpoint (ruta Entrada)
app.get('/usuend', (req, res) => {
  res.send({ msg: 'Servidor de Usuarios Funcionando!' });
});

// Enlazar todas las rutas de aplicación
app.use('/api/usuarios', usuarioRoute);

//Iniciar servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});
