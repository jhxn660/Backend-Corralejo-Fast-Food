import { createCrudService } from '../helpers/crud.helper.js';
import { CierreModel, EstablecimientoModel, HorarioModel, UbicacionModel } from '../models/establecimiento.model.js';

// Los cuatro recursos son CRUD puros: comparten la misma implementación.
const establecimientoService = createCrudService(EstablecimientoModel);
const horarioService = createCrudService(HorarioModel);
const ubicacionService = createCrudService(UbicacionModel);
const cierreService = createCrudService(CierreModel);

export {
    cierreService,
    establecimientoService,
    horarioService,
    ubicacionService
};
