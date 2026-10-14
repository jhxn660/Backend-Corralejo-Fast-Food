import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ['Administrador', 'Empleado', 'Cliente', 'UsuarioT'],
        required: true,
        trim: true
    }
});

const RoleModel = mongoose.model('role', RoleSchema);

export default RoleModel;