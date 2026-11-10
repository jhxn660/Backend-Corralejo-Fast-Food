import { verifyPassword } from "../helpers/bcrypt.helpers.js";
import { generateToken } from "../helpers/jwt.helpers.js";
import { dbGetUserByEmail } from "../services/users.services.js";

// Datos del usuario que viajan dentro del token. Se centraliza para que el login y la
// renovación emitan exactamente el mismo payload (el middleware de autenticación depende de `email`).
const buildTokenPayload = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    state: user.state
});

// Convierte el documento de Mongoose en un objeto plano sin la contraseña,
// apto para devolverse al cliente.
const toPublicUser = (user) => {
    const publicUser = user.toObject();

    delete publicUser.password;

    return publicUser;
};

const loginUser = async ( req, res ) => {
    try {
        const inputData = req.body;

        // Cada validación corta la ejecución con return: sin él, el flujo seguía
        // hasta leer userFound.password de un usuario inexistente y respondía dos veces.
        if( ! inputData?.email ) {
            return res.status(400).json({msg: 'se olvido pasar el correo en el campo email'});
        }

        if( ! inputData.password ) {
            return res.status(400).json({msg: 'se olvido pasar la contraseña en el campo password'});
        }

        const userFound = await dbGetUserByEmail( inputData.email );

        if( ! userFound ) {
            return res.status(404).json({msg: 'El usuario no existe. Por favor registrese'});
        }

        const isValid = verifyPassword( inputData.password, userFound.password );

        if( ! isValid ) {
            return res.status(401).json({msg: 'Credenciales inválidas'});
        }

        const token = generateToken( buildTokenPayload( userFound ) );

        // generateToken devuelve null si la firma falla (p. ej. JWT_SECRET sin definir)
        if( ! token ) {
            return res.status(500).json({msg: 'No se pudo generar el token de acceso'});
        }

        return res.status(200).json({
            msg: 'Login de Usuario',
            token: token,
            data: toPublicUser( userFound )
        });
    } catch (error) {
        console.error( error );

        return res.status(500).json({msg: 'No se pudo verificar la autenticidad de las credenciales'});
    }
};

// Renovación de token: el middleware de autenticación ya validó el token vigente
// y dejó el usuario en req.userFound, así que aquí solo se emite uno nuevo.
const verifyAuthenticate = (req, res) => {
    try {
        const userFound = req.userFound;

        if( ! userFound ) {
            return res.status(401).json({msg: 'No hay un usuario autenticado en la petición'});
        }

        const newToken = generateToken( buildTokenPayload( userFound ) );

        if( ! newToken ) {
            return res.status(500).json({msg: 'No se pudo renovar el token de acceso'});
        }

        return res.status(200).json({
            msg: 'Autenticidad del token Verificado con exito',
            token: newToken,
            data: toPublicUser( userFound )
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            msg: 'No se pudo verificar la autenticidad de las credenciales'
        });
    }
};

export {
    loginUser,
    verifyAuthenticate
};
