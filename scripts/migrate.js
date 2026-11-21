// Ejecuta las migraciones de datos contra la BD de URI_MONGO:  npm run migrate
// Es idempotente: correrla dos veces no cambia nada la segunda vez.
import mongoose from 'mongoose';
import { migrateSaleIdentifiers } from '../src/migrations/sale-identifiers.migration.js';

try {
    // Sin autoIndex: los índices se crean al final de la migración, cuando los datos ya los cumplen
    await mongoose.connect(process.env.URI_MONGO, { autoIndex: false });
    console.log('Migración de identificadores:', await migrateSaleIdentifiers());
} catch (error) {
    console.error('La migración falló:', error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
