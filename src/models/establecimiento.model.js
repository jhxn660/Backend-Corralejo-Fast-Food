import { Schema, model } from 'mongoose';

// ESTABLECIMIENTO
const EstablecimientoSchema = new Schema({
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

// HORARIO
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

// UBICACIÓN
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
    // Campos opcionales de la ficha del local.
    ciudad: {
        type: String,
        default: ''
    },
    referencia: {
        type: String,
        default: ''
    },
    enlaceMapa: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
});

// CIERRE: lo que pasa UNA fecha concreta (p. ej. 2026-12-24), aparte del horario semanal.
// Por defecto esa fecha está cerrada; con estaAbierto: true abre con su propio horario.
// Cambiar el viernes 27 no toca los demás viernes: eso lo hace /horarios.
const HORA_24 = [/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener el formato HH:MM (24 h)'];

const CierreSchema = new Schema({
    fecha: {
        type: String,
        required: [true, 'La fecha del cierre es obligatoria'],
        match: [/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'La fecha debe tener el formato AAAA-MM-DD'],
        // Una fecha solo tiene un registro; un duplicado llega como error 11000 (400)
        unique: true
    },
    estaAbierto: {
        type: Boolean,
        default: false
    },
    // Solo cuentan si estaAbierto es true; vacías si la fecha está cerrada
    horaApertura: {
        type: String,
        default: '',
        match: HORA_24
    },
    horaCierre: {
        type: String,
        default: '',
        match: HORA_24
    },
    // Lo que lee el cliente: el motivo del cierre o una nota del horario de ese día
    motivo: {
        type: String,
        default: '',
        trim: true,
        maxlength: [200, 'El motivo no puede superar 200 caracteres']
    }
}, {
    timestamps: true,
    versionKey: false
});

// El modelo se renombró a Establecimiento, pero conserva la colección original
// ('informacions') para no dejar huérfanos los documentos ya almacenados.
const EstablecimientoModel = model('Establecimiento', EstablecimientoSchema, 'informacions');
const HorarioModel = model('horario', HorarioSchema);
const UbicacionModel = model('ubicacion', UbicacionSchema);
const CierreModel = model('Cierre', CierreSchema, 'cierres');

export default EstablecimientoModel;

export {
    CierreModel,
    EstablecimientoModel,
    HorarioModel,
    UbicacionModel
};
