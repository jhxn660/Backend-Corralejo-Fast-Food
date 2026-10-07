const express = require('express');

const app = express();

//Iniciar servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor está corriendo en http://localhost:${port}`);
});
