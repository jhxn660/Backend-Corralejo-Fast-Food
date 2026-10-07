// const express = require('express');   //CommonJS
import express from 'express';           //ESModule

const app = express();

//Iniciar servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});
