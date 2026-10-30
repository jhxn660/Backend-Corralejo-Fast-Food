// import express from 'express';          // ESModule
// const express = require('express');     // CommonJS

import express from 'express';

import conexion from './config/mongo.config.js';
import userRoute from './routes/users.routes.js';
import categoriesRoute from './routes/categories.routes.js';
import insumosRoute from './routes/insumos.routes.js';
import authRoute from './routes/auth.routes.js';

const port = process.env.PORT || 3001;

// Instancia de Express
const app = express();

// Conexión a la base de datos
conexion();

// Middlewares: habilita a la aplicación para interpretar JSON
app.use(express.json());

// Endpoint de prueba (health check)
app.get('/health', (req, res) => {
    res.status(200).json({ msg: 'Servidor de Corralejo Fast Food Funcionando!' });
});

// Rutas de la aplicación
app.use('/api/users', userRoute);
app.use('/api/categories', categoriesRoute);
app.use('/api/insumos', insumosRoute);
app.use('/api/auth', authRoute);

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor está corriendo en http://localhost:${port}`);
});