import userModel from '../models/user.model.js';

/**
 * Roles del sistema. La única fuente de verdad es el enum `role` del modelo User:
 * aquí solo se les da un nombre en código y se agrupan para las rutas.
 */
const USER_ROLES = Object.freeze([ ...userModel.schema.path('role').enumValues ]);

// Si alguien renombra o quita un rol del modelo, el servidor falla al arrancar y no en mitad de una petición
const roleFromModel = (role) => {
    if (!USER_ROLES.includes(role)) {
        throw new Error(`El rol '${role}' no existe en el enum del modelo User (${USER_ROLES.join(', ')})`);
    }

    return role;
};

const ROLES = Object.freeze({
    OWNER: roleFromModel('Owner'),
    ADMIN: roleFromModel('Administrador'),
    EMPLOYEE: roleFromModel('Empleado'),
    CLIENT: roleFromModel('Cliente'),
    // Visitante sin cuenta: no está en el enum porque nunca se guarda en BD.
    // Es la ausencia de token (ver optionalAuthMiddleware en authenticate.middleware.js).
    VISITOR: 'Usuario'
});

// Jerarquía: cada rol hereda lo del siguiente. 'Owner' incluye todo lo de 'Administrador'
// y 'Administrador' todo lo de 'Empleado'.
const ADMIN_ROLES = Object.freeze([ ROLES.OWNER, ROLES.ADMIN ]);
const STAFF_ROLES = Object.freeze([ ...ADMIN_ROLES, ROLES.EMPLOYEE ]);

// Cuentas que se gestionan en Gestión de Usuarios. Dar de baja a un Administrador es exclusivo
// del Owner (ver deleteUser en users.controllers.js).
const OWNER_MANAGEABLE_ROLES = Object.freeze([ ROLES.ADMIN, ROLES.EMPLOYEE ]);

export { USER_ROLES, ROLES, ADMIN_ROLES, STAFF_ROLES, OWNER_MANAGEABLE_ROLES };
