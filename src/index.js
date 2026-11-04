import 'dotenv/config'; // <-- Agrega esta línea al inicio absoluto
import express from 'express';
import conexion from './config/mongo.config.js';

import comentarioRoute from './routes/Comentario.routes.js';
import informacionRoute from './routes/Informacion.routes.js';
import pqrsRoute from './routes/PQRS.routes.js';
import usuarioRoute from './routes/Usuario.routes.js';

const app = express();

conexion();

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        estado: 'OK',
        proyecto: 'Corralejo Fast Food - CFF',
        mensaje: 'Servidor Backend funcionando correctamente'
    });
});

// Rutas de la API
app.use('/api/comentario', comentarioRoute);
app.use('/api/pqrs', pqrsRoute);
app.use('/api', informacionRoute);
app.use('/api/usuarios', usuarioRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log();
    console.log(`http://localhost:${PORT}`);
    console.log();
});