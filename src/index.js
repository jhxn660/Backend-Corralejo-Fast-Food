// const express = require('express');   //CommonJS
import express from 'express';           //ESModule

const app = express();


// Definiendo 1 endpoint (ruta de entrada)
app.get('/health', (req, res) => {
  res.send('Servidor del Corralejo Está Funcionando!!')
});

//Obtener todos los pedidos
app.get('/pedidos', (req, res) => {
  res.send('Servidor del pedidos Está Funcionando!!')
});
//Crear pedidos
app.post('/pedidos', (req, res) => {
  res.send('Registra un pedido!!')
});

//Actualizar totalmente
app.put('/pedidos', (req, res) => {
  res.send('Actualiza todas las propiedades de un pedido!!')
});

//Actualizar parcialmente
app.patch('/pedidos', (req, res) => {
  res.send('Actualiza una o mas propiedades de un pedido!!')
});

//Eliminar un pedido
app.delete('/pedidos', (req, res) => {
  res.send('Elimina un pedido!!')
});


//Iniciar servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});
