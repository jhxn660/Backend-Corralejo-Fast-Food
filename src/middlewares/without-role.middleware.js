// CAMBIO: el registro público convierte al visitante ('Usuario', sin cuenta) en 'Cliente'.
// Antes solo se borraba el rol enviado y se dependía del valor por defecto del Schema; ahora
// se asigna de forma explícita para que la regla de negocio no cambie si cambia ese default,
// y para que nadie pueda auto-asignarse 'Administrador' o 'Empleado' desde el formulario público.
const withoutRoleMiddleware = (req, res, next) => {
    req.body = { ...req.body, role: 'Cliente' };

    next();
};

export default withoutRoleMiddleware;
