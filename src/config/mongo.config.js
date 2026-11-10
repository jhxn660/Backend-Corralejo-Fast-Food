import mongoose from 'mongoose';

const URI_MONGO = process.env.URI_MONGO || 'mongodb://localhost:27017/';

const conexion = async () => {
    try {
        await mongoose.connect(URI_MONGO);
        console.log('Conectado a la base de datos');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
};

export default conexion;
