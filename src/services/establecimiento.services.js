import { createCrudService } from '../helpers/crud.helper.js';
import { EstablecimientoModel, HorarioModel, UbicacionModel } from '../models/establecimiento.model.js';

// Los tres recursos son CRUD puros: comparten la misma implementación.
const establecimientoService = createCrudService(EstablecimientoModel);
const horarioService = createCrudService(HorarioModel);
const ubicacionService = createCrudService(UbicacionModel);

export {
    establecimientoService,
    horarioService,
    ubicacionService
};
