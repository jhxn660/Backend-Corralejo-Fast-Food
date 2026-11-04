import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.model.js';
// Cambiamos la importación para usar el nuevo nombre de la función
import { generateToken } from '../helpers/jwt.helpers.js';

// Registrar usuario
const crearUsuario = async (req, res) => {
    const { correo, password, nombre } = req.body;
    try {
        let usuario = await Usuario.findOne({ correo });
        if (usuario) {
            return res.status(400).json({ ok: false, msg: 'El usuario ya existe con ese correo' });
        }

        usuario = new Usuario(req.body);

        // Encriptar contraseña
        const salt = bcrypt.genSaltSync();
        usuario.password = bcrypt.hashSync(password, salt);

        await usuario.save();

        // Generar JWT (Quitamos el 'await' porque generateToken ahora es sincrónico)
        const token = generateToken({ uid: usuario.id, nombre: usuario.nombre });

        res.status(201).json({
            ok: true,
            uid: usuario.id,
            nombre: usuario.nombre,
            token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ ok: false, msg: 'Por favor hable con el administrador' });
    }
};

// Login de usuario
const loginUsuario = async (req, res) => {
    const { correo, password } = req.body;
    try {
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) {
            return res.status(400).json({ ok: false, msg: 'El usuario no existe con ese correo' });
        }

        // Confirmar contraseñas
        const validPassword = bcrypt.compareSync(password, usuario.password);
        if (!validPassword) {
            return res.status(400).json({ ok: false, msg: 'Contraseña incorrecta' });
        }

        // Generar JWT (Quitamos el 'await' también aquí)
        const token = generateToken({ uid: usuario.id, nombre: usuario.nombre });

        res.json({
            ok: true,
            uid: usuario.id,
            nombre: usuario.nombre,
            token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ ok: false, msg: 'Por favor hable con el administrador' });
    }
};

export { crearUsuario, loginUsuario };