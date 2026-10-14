// mongoose.createConnection('mongodb://127.0.0.1:27017/test').asPromise();
// ODM:
import mongoose from "mongoose";

const URL_REMOTE = 'mongodb+srv://Mateo:123456+@cluster0.ztjam83.mongodb.net/'

const conexion = async () => {
    try {
        await mongoose.connect(URL_REMOTE);
        // conectado a la base de datos de MongoDB
        console.log('Conectado a la base de datos');
    } catch (error) {
        console.error('Error al conectar a la base de datos:');
    }
    
}

export default conexion;