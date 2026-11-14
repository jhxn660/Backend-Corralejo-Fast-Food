import mongoose from 'mongoose';

const URI_MONGO = process.env.URI_MONGO || 'mongodb://localhost:27017/';

/**
 * Abre la conexión compartida de Mongoose (un pool por proceso que reutilizan todos los modelos).
 * Detalles que no se ven a simple vista:
 *  - index.js la llama SIN await: mientras conecta, Mongoose encola las consultas (buffering)
 *    y las ejecuta al conectar. Si nunca conecta, cada consulta falla a los 10 s (bufferTimeoutMS).
 *  - Al conectar, Mongoose crea los índices declarados en los Schemas (unique, index) con
 *    autoIndex. Si los datos existentes violan un unique nuevo, el índice no se crea y solo
 *    queda un aviso en consola: la regla deja de aplicarse en silencio.
 *  - Si la conexión inicial falla, se registra y el servidor sigue arriba (sin BD).
 */
const conexion = async () => {
    try {
        await mongoose.connect(URI_MONGO);
        console.log('Conectado a la base de datos');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
};

export default conexion;
