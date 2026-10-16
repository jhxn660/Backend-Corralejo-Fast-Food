// mongoose.createConnection('mongodb://127.0.0.1:27017/test').asPromise();
// ODM:
import mongoose from "mongoose";


//const URI_LOCAL = 'mongodb://localhost:27017/'
const URI_MONGO = process.env.URI_MONGO || 'mongodb://localhost:27017/';

const conexion = async () => {
    try {
        await mongoose.connect(URI_MONGO);
        // conectado a la base de datos de MongoDB
        console.log('Conectado a la base de datos');
    } catch (error) {
        console.error('Error al conectar a la base de datos:');
    }
    
}

export default conexion;