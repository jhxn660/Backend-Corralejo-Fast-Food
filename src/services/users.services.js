import { generatePassword } from "../helpers/bcrypt.helpers.js";
import userModel from "../models/user.model.js";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[^\s]{7,60}$/;

// Crear un usuario y devolverlo sin la contraseña

// {
//   "name": "Juan",
//   "email": "45547833@gmail.com",
//   "password": "Hol@hol4",
//   "phone": "3155248932",
//   "state": true
// }

const dbCreateUser = async (newUser) => {
    if (!passwordRegex.test(newUser.password)) {
        const error = new Error( 'La contraseña debe tener entre 7 y 50 caracteres, incluir al menos una mayúscula, una minúscula, un número y un símbolo' );
        error.name = 'PasswordValidationError';
        error.statusCode = 400;

        throw error;
    }

    const user = await userModel.create({
        ...newUser,
        password: generatePassword(newUser.password)
    });

    // Separa la contraseña del resto de datos y devuelve solo el resto
    const { password, ...userWithoutPassword } = user.toObject();

    return userWithoutPassword;
};

// Obtener un usuario por su ID
const dbGetUser = async (id) => {
    return await userModel
        .findOne({ _id: id })
        .select('-password')                        // Excluye la contraseña
        .populate('createdBy', 'name email role');
};

// Obtener la lista de usuarios con paginación, filtro de estado (activos, inactivos o todos) y filtro opcional por rol
const dbGetUsers = async ( page = 1, limit = 10, status = 'true', role ) => {
    // Paso 1: Sanitizar los valores de paginación (números enteros >= 1)
    const pageNumber = Math.max( 1, Number( page ) || 1 );
    const limitNumber = Math.max( 1, Number( limit ) || 10 );

    // Paso 2: Calcular el desplazamiento o salto de registros (skip)
    // Fórmula: (página - 1) * límite
    const skip = ( pageNumber - 1 ) * limitNumber;

    // Paso 3: Construir el filtro dinámico según los query params 'status' y 'role'
    //   - status === 'true'  -> solo usuarios activos ({ status: true })
    //   - status === 'false' -> solo usuarios inactivos ({ status: false })
    //   - status === 'all'   -> todos sin distingo de status ({})
    //   - por defecto        -> solo usuarios activos ({ status: true })
    let filter = {};

    // CAMBIO: la lista coincide ahora con el enum de roles del modelo User; antes incluía 'UsuarioT'
    // (inexistente) y omitía 'Owner' y 'Cliente', de modo que no se podía filtrar por ellos.
    const availableRoles = ['Owner', 'Administrador', 'Empleado', 'Cliente', 'Usuario'];

    if ( status === 'true' || status === true ) {
        filter.status = true;
    } else if ( status === 'false' || status === false ) {
        filter.status = false;
    } else if ( status === 'all' ) {
        filter = {}; // Objeto vacío: no filtra por status (trae todos)
    } else {
        filter.status = true; // Valor por defecto
    }

    // Filtrar por rol (si se envía y es válido)
    if ( role && availableRoles.includes( role ) ) {
        filter.role = role;
    }

    // Paso 4: Ejecutar en paralelo la consulta paginada y el conteo total con el mismo filtro
    const [ users, total ] = await Promise.all([
        // 4.1: Consulta los documentos aplicando el filtro, skip (saltar) y limit (cantidad máxima)
        userModel.find( filter )
            .select('-password')
            .skip( skip )
            .limit( limitNumber )
            .populate('createdBy', 'name email role'),

        // 4.2: Cuenta el total de documentos que coinciden exactamente con el filtro aplicado
        userModel.countDocuments( filter )
    ]);

    // Paso 5: Retornar los datos obtenidos junto con la metadata de paginación y filtro
    return {
        users,                                        // Lista de usuarios correspondientes a la página actual
        total,                                        // Total de usuarios que coinciden con el filtro
        page: pageNumber,                             // Número de página consultada
        limit: limitNumber,                           // Cantidad de registros devueltos por página
        totalPages: Math.ceil( total / limitNumber ) // Total de páginas disponibles
    };
};

const dbUpdateUser = async ( id, userUpdated ) => {
    return await userModel.findOneAndUpdate(
        { _id: id },            // Objeto de consulta para buscar el documento que deseamos actualizar
        userUpdated,            // El objeto con los datos del Documento que deseamos actualizar
        {
            new: true,          // Retorna el documento ya actualizado
            runValidators: true // Ejecuta las validaciones definidas en el Schema de Mongoose al actualizar
        }
    )
    .select('-password');
};

// Eliminar un usuario por su ID
const dbDeleteUser = async (id) => {
    return await userModel
        .findOneAndDelete({ _id: id })
        .select('-password');
};

// Consultar por correo para el login
// Ojo: SI devuelve la contraseña, porque el login la necesita para compararla
// No usar en rutas que respondan datos al cliente
const dbGetUserByEmail = async (email, state = true) => {
    return await userModel.findOne({ email: email, state: state });
};

export {
    dbCreateUser,
    dbGetUser,
    dbGetUsers,
    dbUpdateUser,
    dbDeleteUser,
    dbGetUserByEmail
};
