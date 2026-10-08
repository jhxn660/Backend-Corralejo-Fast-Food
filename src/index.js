// const express = require('express');   //CommonJS
import express from 'express';           //ESModule

const app = express();

// Definiendo 1 endpoint (ruta Entrada)
app.get('/usuend', (req, res) => {
  res.send({msg: 'Servidor de Usuarios Funcionando!'});
});

// Obtener Usuarios
app.get('/usuarios', (req, res) => {
  res.json({ msg: 'Listar todos los usuarios'});
});

// Crear Usuario
app.post('/usuarios', (req, res) => {
  res.json({ msg: 'Registra Usuario'});
});

// Actualizar Totalmente
app.put('/usuarios', (req, res) => {
  res.json({ msg: 'Actualizar todas las propiedades de un usuario'});
});

// Actualizar Parcialmente
app.patch('/usuarios', (req, res) => {
  res.json({ msg: 'Actualizar una o mas propiedades del usuario'});
});

// Eliminar un Usuario
app.delete('/usuarios', (req, res) => {
  res.json({ msg: 'Elimina un Usuario'});
});

//Iniciar servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});
