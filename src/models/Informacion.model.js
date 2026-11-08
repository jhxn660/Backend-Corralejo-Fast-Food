import { Schema, model } from 'mongoose';

//INFORMACIÓN
const InformacionSchema = new Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio']
    },
    subtitulo: {
        type: String,
        default: ''
    },
    contenido: {
        type: String,
        required: [true, 'El contenido descriptivo es obligatorio']
    },
    categoria: {
        type: String,
        required: [true, 'La categoría es obligatoria'],
        enum: ['Misión', 'Visión', 'Narrativa Creativa', 'El Origen', 'El Secreto del Banquete', 'La Comunidad Gastronómica', 'El Lema de la Casa']
    }
}, {
    timestamps: true,
    versionKey: false
});

//HORARIO
const HorarioSchema = new Schema({
    dia: {
        type: String,
        required: [true, 'El día de la semana es obligatorio'],
        enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    },
    horaApertura: {
        type: String,
        required: [true, 'La hora de apertura es obligatoria']
    },
    horaCierre: {
        type: String,
        required: [true, 'La hora de cierre es obligatoria']
    },
    estaAbierto: {
        type: Boolean,
        default: true
    },
    estadoNota: {
        type: String, 
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
});

//UBICACIÓN
const UbicacionSchema = new Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio']
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria']
    },
    direccion: {
        type: String,
        required: [true, 'La dirección es obligatoria']
    },
    telefono: {
        type: String,
        required: [true, 'El teléfono es obligatorio']
    },
    enlaceMapa: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
});


const InformacionModel = model('informacion', InformacionSchema);
const HorarioModel = model('horario', HorarioSchema);
const UbicacionModel = model('ubicacion', UbicacionSchema);

// EXPORTACION DE MODELOS
export default InformacionModel; 

export {
    InformacionModel,
    HorarioModel,
    UbicacionModel
};