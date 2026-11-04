import mongoose from "mongoose";

const URI_LOCAL = 'mongodb://localhost:27017/';
const URL_REMOTE = 'mongodb+srv://JulianMilo17:Julian0000@cluster0.pvz6qac.mongodb.net/';

const conexion = async () => {
    try {
        await mongoose.connect(URL_REMOTE);
        console.log('Conectado a la base de datos MongoDB');
    } catch (error) {
        console.error('Error al conectar a la base de datos:');
    }

}

export default conexion;