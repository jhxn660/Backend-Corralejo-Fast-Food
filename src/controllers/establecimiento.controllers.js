import { createCrudController } from '../helpers/crud.helper.js';
import { establecimientoService, horarioService, ubicacionService } from '../services/establecimiento.services.js';

const establecimiento = createCrudController(establecimientoService, {
    create: 'Registrar información',
    getById: 'Obtener información por ID',
    getAll: 'Listar total de información',
    update: 'Actualizar información',
    remove: 'Eliminar información',
    notFound: 'Información no encontrada',
    errors: {
        create: 'No se pudo registrar la información',
        getById: 'No se pudo obtener la información',
        getAll: 'No se puede listar la información',
        update: 'No se pudo actualizar la información',
        remove: 'No se pudo eliminar la información'
    }
});

const horario = createCrudController(horarioService, {
    create: 'Registrar horario',
    getById: 'Obtener horario por ID',
    getAll: 'Listar total de horarios',
    update: 'Actualizar horario',
    remove: 'Eliminar horario',
    notFound: 'Horario no encontrado',
    errors: {
        create: 'No se pudo registrar el horario',
        getById: 'No se pudo obtener el horario',
        getAll: 'No se pueden listar los horarios',
        update: 'No se pudo actualizar el horario',
        remove: 'No se pudo eliminar el horario'
    }
});

const ubicacion = createCrudController(ubicacionService, {
    create: 'Registrar ubicación',
    getById: 'Obtener ubicación por ID',
    getAll: 'Listar total de ubicaciones',
    update: 'Actualizar ubicación',
    remove: 'Eliminar ubicación',
    notFound: 'Ubicación no encontrada',
    errors: {
        create: 'No se pudo registrar la ubicación',
        getById: 'No se pudo obtener la ubicación',
        getAll: 'No se pueden listar las ubicaciones',
        update: 'No se pudo actualizar la ubicación',
        remove: 'No se pudo eliminar la ubicación'
    }
});

export const {
    create: createEstablecimiento,
    getById: getEstablecimiento,
    getAll: getEstablecimientoList,
    update: updateEstablecimiento,
    remove: deleteEstablecimiento
} = establecimiento;

export const {
    create: createHorario,
    getById: getHorario,
    getAll: getHorarios,
    update: updateHorario,
    remove: deleteHorario
} = horario;

export const {
    create: createUbicacion,
    getById: getUbicacion,
    getAll: getUbicaciones,
    update: updateUbicacion,
    remove: deleteUbicacion
} = ubicacion;
