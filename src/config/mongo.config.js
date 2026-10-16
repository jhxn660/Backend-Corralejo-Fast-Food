// mongoose.createConnection('mongodb://127.0.0.1:27017/test').
// ODM: 
import mongoose from "mongoose";

const URI_LOCAL = 'mongodb://localhost:27017/';
const URL_REMOTE = 'mongodb+srv://Diego:2103Diego@cluster0.bx7mi6e.mongodb.net/';

// se quelize (SQL) -> MySQL, postgreSQL, MariaDB, SQLite, Microsoft SQL Server
// Prisma (SQL, NoSQL) -> MySQL
const conexion = async () => {
    try {
        await mongoose.connect(URL_REMOTE);
        console.log('Conectado a la base de datos MongoDB');
    } catch (error) {
        console.error('Error al conectar a la base de datos:');
    }

}

export default conexion;