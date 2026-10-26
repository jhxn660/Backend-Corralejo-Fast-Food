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

    // paso 4 Generar el token (tarjeta que presento que atentica y autoriza)

    // paso 5 Responder al cliente (enviar el token, importante no devolver la contraseña)


    res.json({
        msg: 'Login de usuario',
        credentials
    });
}

const verifyAuthenticate = ( req, res ) => {
    res.json({
        msg: 'Verifica y actualiza las credenciales del usuario'
    });
}

export {
    loginUser,
    verifyAuthenticate
}