import { HttpError } from './http-error.helper.js';

// Los documentos sin el campo `status` cuentan como visibles.
const ONLY_ACTIVE = Object.freeze({ status: { $ne: false } });

// Cuerpo de PATCH /:id/status. Se exige booleano estricto: "false" (texto) sería truthy.
const parseStatusBody = (body) => {
    if (typeof body?.status !== 'boolean') {
        throw new HttpError(400, "El campo 'status' es obligatorio y debe ser booleano (true o false)");
    }

    return body.status;
};

// Query ?status=true|false|all de los listados de gestión (por defecto: all).
const buildVisibilityFilter = (value = 'all') => {
    if (value === 'all') return {};
    if (value === 'true') return { ...ONLY_ACTIVE };
    if (value === 'false') return { status: false };

    throw new HttpError(400, "El filtro 'status' solo admite true, false o all");
};

export { ONLY_ACTIVE, parseStatusBody, buildVisibilityFilter };
