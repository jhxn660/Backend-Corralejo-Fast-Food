import { findUserByEmail, createUser } from '../services/users.services.js';
import { hashPassword, comparePassword } from '../helpers/bcrypt.helpers.js';
import { generateToken } from '../helpers/jwt.helpers.js';
import handleMongooseError from '../helpers/handle-mongoose-error.helper.js';

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

        const token = generateToken(user._id, user.rol);
        res.status(200).json({ token, user: { id: user._id, email: user.email, rol: user.rol } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        const hashedPassword = await hashPassword(password);
        const newUser = await createUser({ nombre, email, password: hashedPassword });
        res.status(201).json({ message: 'Usuario creado exitosamente', userId: newUser._id });
    } catch (error) {
        handleMongooseError(error, res);
    }
};

export { login, register };