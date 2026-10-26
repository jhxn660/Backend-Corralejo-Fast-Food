import { dbGetUserByEmail } from "../services/usuarios.services.js";

const loginUser = async ( req, res ) => {
    
    try {
        // Paso 1: Obtener las credxenciales del usuario { email: '...', password: '...'}
        const inputData = req.body;

        // Valida si el campo email esta dentro del formulario
        if( ! inputData.email ) {
            // Crea una Exception --- Desarrollador
            // throw new Error( 'Se olvido pasar el correo en el campo email' );
            res.json({ msg: 'Se olvido pasar el correo en el campo email'});
        }

        if( ! inputData.password ) {
            // throw new Error( 'Se le olvido pasar la contraseña en el campo password' );
            res.json({ msg: 'Se le olvido pasar la contraseña en el campo password'});
        }

        // Paso 2: Verificar si el Usuario existe ( ¿email, Está registrado en la BD?)
        // TODO: Hacer una peticion a nuestra base de datos -- PENDIENTE EJEMPLO
        const userFound = await dbGetUserByEmail( inputData.email );

        if( ! userFound ) {
            res.json({ msg: 'El Email no existe. Por favor registrese' });
        }


        // Paso 3: Verificar si la contraseña es valida
        // TODO: Encryptar la Contraseña antes de validarla (createUsuario, dbcreateUsuario)

        // Paso 4: Generar el Token "Es Como una Tarjeta que presento que Autentica y Autoriza"

        // Paso 5: Responder al cliente (Enviar el Token, Importante: No devolver el Password) 

        res.json({ msg: 'Login de Usuario', inputData });
        
    } catch (error) {
        
    }
}

const verifyAuthenticate = ( req, res) =>  {

    res.json({
        msg: 'Verifica y Actualiza las credenciales del usuario'
    })

}


export {
    loginUser, 
    verifyAuthenticate
}