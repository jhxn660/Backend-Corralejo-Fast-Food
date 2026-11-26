import conexion from './config/mongo.config.js';

import app from './app.js';

// Punto de entrada (npm run dev / npm start). Solo arranca: la aplicación se arma en app.js.
// Las variables de entorno ya están cargadas: los scripts ejecutan node con --env-file .env.
const port = process.env.PORT || 3001;

// La conexión se lanza sin await: Mongoose encola las consultas hasta que el
// driver esté listo, así el servidor HTTP no depende del tiempo de arranque de Mongo.
conexion();

app.listen(port, () => {
    console.log(`Servidor está corriendo en http://localhost:${port}`);
});
