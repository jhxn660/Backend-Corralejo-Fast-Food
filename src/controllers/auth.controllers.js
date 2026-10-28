import { verifyPassword } from "../helpers/bcrypt.helpers.js";
import { generateToken } from "../helpers/jwt.helpers.js";
import { dbGetUserByEmail } from "../services/users.services.js"

const loginUser = async ( req, res ) => {
    // paso 1 Obtener las credenciales del usuario
    const inputData = req.body;

    // Validar si el campo email no viene dentro de las inputData
    if( ! inputData.email ) {
        // Crear una exception - desarrollador
        // throw new Error( 'Se olvido pasar el correo en el campo email');
        res.json({
            msg: 'se olvido pasar el correo en el campo email'
        });
    }

    // Validar si el campo password no viene dentro de las inputData
    if( ! inputData.password ) {
        res.json({
            msg: 'se olvido pasar la contraseña en el campo password'
        });
    }

    // paso 2 Verificar si el usuario existe ¿email esta registrado?
    const userFound = await dbGetUserByEmail( inputData.email );

    if( ! userFound ) {
        res.json({
            msg: 'El usuario no existe. Por favor registrese'
        });
    }

    // paso 3 Verificar si la contraseña es valida
    const isValid = verifyPassword( inputData.password, userFound.password )

    if( ! isValid ) {
        res.json({
            msg: 'El password es invalido'
        });
    }

    // paso 4 Generar el token (tarjeta que presento que atentica y autoriza)
    const payload = {
        _id: userFound._id,
        name: userFound.name,
        email: userFound.email,
        role: userFound.role,
        status : userFound.status
    }

    const token = generateToken( payload );

    // paso 5 Responder al cliente (enviar el token, importante no devolver la contrasena)
    const jsonObj = userFound.toObject();

    // Eliminar propiedades no deseadas
    delete jsonObj.password;
    
    res.json({
        msg: 'Login de usuario ',
        token: token,
        data: jsonObj
    });
}

const verifyAuthenticate = ( req, res ) => {
    const data = req-holaatodos;
    console.log('')
    
    console.log('Soy el controlador')

    res.json({
        msg: 'Verifica y actualiza las credenciales del usuario'
    });

    // Generar un nuevo Token
    const newPayload = {
        _id: userFound._id,
        name: userFound.name,
        email: userFound.email,
        role: userFound.role,
        status: userFound.status
    }

    const token = generateToken( newPayload );
}

export {
    loginUser,
    verifyAuthenticate
}