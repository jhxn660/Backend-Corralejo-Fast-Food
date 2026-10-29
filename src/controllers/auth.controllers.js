import { generatePassword, verifyPassword } from "../helpers/bcrypt.helpers.js";
import { generateToken } from "../helpers/jwt.helpers.js";
import { dbGetUserByEmail } from "../services/usuarios.services.js";

// Login de usuario: valida las credenciales, genera el token y devuelve el usuario sin el password
const loginUser = async (req, res) => {
    try {

        // Paso 1: Obtener las credenciales del usuario { email: '...', password: '...' }
        const inputData = req.body;

        // Valida si el campo email está dentro del formulario
        if (!inputData.email) {
            // Crea una Exception --- Desarrollador
            // throw new Error( 'Se olvido pasar el correo en el campo email' );
            res.json({ msg: 'Se olvido pasar el correo en el campo email' });
        }

        // Valida si el campo password está dentro del formulario
        if (!inputData.password) {
            // throw new Error( 'Se le olvido pasar la contraseña en el campo password' );
            res.json({ msg: 'Se le olvido pasar la contraseña en el campo password' });
        }

        // Paso 2: Verificar si el usuario existe (¿el email está registrado en la BD?)
        // TODO: Hacer una petición a nuestra base de datos -- PENDIENTE EJEMPLO
        const userFound = await dbGetUserByEmail(inputData.email);

        if (!userFound) {
            res.json({ msg: 'El Email no existe. Por favor registrese' });
        }

        // Paso 3: Verificar si la contraseña es válida
        // Encriptar la contraseña antes de validarla (createUsuario, dbcreateUsuario)
        const isValid = verifyPassword(inputData.password, userFound.password);

        if (!isValid) {
            res.json({ msg: 'El password es invalido' });
        }

        // Paso 4: Generar el token
        // "Es como una tarjeta que presento que autentica y autoriza"
        const payload = {
            _id: userFound._id,
            name: userFound.name,
            email: userFound.email,
            role: userFound.role,
            state: userFound.state
        };

        const token = generateToken(payload);

        // Paso 5: Responder al cliente
        // Enviar el token. Importante: NO devolver el password
        const jsonObj = userFound.toObject();   // Convierte el documento (BSON) en un objeto de JavaScript

        delete jsonObj.password;                // Elimina las propiedades no deseadas

        res.json({
            msg: 'Login de Usuario',
            token: token,
            data: jsonObj
        });

    } catch (error) {
        console.error(error);

        res.json({
            msg: 'No se pudo verificar la autenteicidad de las credenciales'
        });
    }
};

// Verificar autenticación: recibe el usuario desde el middleware de autenticación y renueva el token
const verifyAuthenticate = (req, res) => {
    try {

        // Paso 1: Obtener los datos del usuario que envía el middleware de autenticación
        const userFound = req.userFound;

        // Paso 2: Crear el nuevo payload y generar el token
        const newPayload = {
            _id: userFound._id,
            name: userFound.name,
            email: userFound.email,
            role: userFound.role,
            state: userFound.state
        };

        const newToken = generateToken(newPayload);

        // Paso 3: Eliminar las propiedades sensibles del objeto que se retorna
        const jsObj = userFound.toObject();     // Convierte el documento (BSON) en un objeto de JavaScript

        delete jsObj.password;                  // Elimina el campo password del objeto que retornamos al usuario

        res.json({
            msg: 'Autenticidad del token Verficado con exito',
            token: newToken,
            data: jsObj
        });

    } catch (error) {
        console.error(error);

        res.json({
            msg: 'No se pudo verificar la autenteicidad de las credenciales'
        });
    }
};

export {
    loginUser,
    verifyAuthenticate
};