import app from './app.js';
import conexion from './config/mongo.config.js';

const port = process.env.PORT || 3001;

// La conexión se lanza sin await: Mongoose encola las consultas hasta que el
// driver esté listo, así el servidor HTTP no depende del tiempo de arranque de Mongo.
conexion();

app.listen(port, () => {
    console.log(`Servidor está corriendo en http://localhost:${port}`);
});
