import { HttpError } from './http-error.helper.js';

// Los documentos anteriores a la bandera no tienen el campo `isActive`: cuentan como visibles.
const ONLY_ACTIVE = Object.freeze({ isActive: { $ne: false } });

// Cuerpo de PATCH /:id/status. Se exige booleano estricto: "false" (texto) sería truthy.
const parseIsActiveBody = (body) => {
    if (typeof body?.isActive !== 'boolean') {
        throw new HttpError(400, "El campo 'isActive' es obligatorio y debe ser booleano (true o false)");
    }

    return body.isActive;
};

// Query ?isActive=true|false|all de los listados de gestión (por defecto: all).
const buildVisibilityFilter = (value = 'all') => {
    if (value === 'all') return {};
    if (value === 'true') return { ...ONLY_ACTIVE };
    if (value === 'false') return { isActive: false };

    throw new HttpError(400, "El filtro 'isActive' solo admite true, false o all");
};

export { ONLY_ACTIVE, parseIsActiveBody, buildVisibilityFilter };
