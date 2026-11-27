import { ADMIN_ROLES, ROLES } from '../config/roles.config.js';
import asyncHandler from '../helpers/async-handler.helper.js';
import { assertFound, HttpError } from '../helpers/http-error.helper.js';
import { dbCreateUser, dbDeleteUser, dbGetUser, dbGetUsers, dbUpdateUser } from '../services/users.services.js';

const NOT_FOUND = 'Usuario no encontrado';

// Solo un Owner puede crear, editar o eliminar otro Owner, o ascender a alguien a Owner.
// Sin esta regla un Administrador podría darse a sí mismo (o a otro) el rol máximo.
const assertCanManageOwner = (actor, ...roles) => {
    if (roles.includes(ROLES.OWNER) && actor?.role !== ROLES.OWNER) {
        throw new HttpError(403, 'Solo un Owner puede gestionar cuentas Owner');
    }
};

/**
 * Lo usan dos rutas:
 *   - POST /api/users (administración): el rol viene en el body.
 *   - POST /api/auth/register (público): withoutRoleMiddleware ya forzó role='Cliente'.
 * createdBy es quien está autenticado; en el registro público queda en null.
 */
const createUser = asyncHandler(async (req, res) => {
    assertCanManageOwner(req.userFound, req.body.role);

    const data = await dbCreateUser({ ...req.body, createdBy: req.userFound?._id ?? null });

    res.status(201).json({ msg: 'Registra Usuario', data });
}, 'Error al registrar el usuario');

const getUser = asyncHandler(async (req, res) => {
    res.json({ msg: 'Obtiene un Usuario por ID', data: assertFound(await dbGetUser(req.params.id), NOT_FOUND) });
}, 'No se pudo obtener el Usuario por ID');

// ?page=1&limit=15&status=true|false|all&role=<rol del modelo User>
const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 15, status = 'all', role } = req.query;

    res.json({ msg: 'Lista de Usuarios', data: await dbGetUsers(page, limit, status, role) });
}, 'No ha podido obtener los usuarios');

// PATCH y PUT comparten handler. La ruta ya garantizó que es un administrador o el propio usuario.
const updateUser = asyncHandler(async (req, res) => {
    // La contraseña no se cambia por aquí (findOneAndUpdate no la hashearía) ni el autor del registro
    const { password, createdBy, ...changes } = req.body;

    // Quien edita su propia cuenta sin ser administrador no puede cambiarse el rol ni el estado
    if (!ADMIN_ROLES.includes(req.userFound.role)) {
        delete changes.role;
        delete changes.status;
    }

    const target = assertFound(await dbGetUser(req.params.id), NOT_FOUND);
    assertCanManageOwner(req.userFound, target.role, changes.role);

    res.json({ msg: 'Usuario Actualizado', data: await dbUpdateUser(req.params.id, changes) });
}, 'No se ha podido actualizar el usuario');

const deleteUser = asyncHandler(async (req, res) => {
    const target = assertFound(await dbGetUser(req.params.id), NOT_FOUND);
    assertCanManageOwner(req.userFound, target.role);

    // Dar de baja a un Administrador es exclusivo del Owner. Un Administrador sí puede dar de
    // baja Empleados y Clientes, pero no a otro Administrador (ni a sí mismo).
    if (target.role === ROLES.ADMIN && req.userFound?.role !== ROLES.OWNER) {
        throw new HttpError(403, 'Solo un Owner puede dar de baja administradores');
    }

    res.json({ msg: 'Usuario Eliminado', data: assertFound(await dbDeleteUser(req.params.id), NOT_FOUND) });
}, 'No se ha podido eliminar el usuario');

export {
    createUser,
    getUser,
    getUsers,
    updateUser,
    deleteUser
};
