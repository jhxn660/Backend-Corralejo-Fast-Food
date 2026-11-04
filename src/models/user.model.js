//Define los campos que tendrá un usuario en la base de datos MongoDB

import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSchema = new Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, default: 'cliente' }
}, { timestamps: true });

export default model('User', userSchema);