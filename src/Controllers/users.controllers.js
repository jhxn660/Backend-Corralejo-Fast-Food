import { getAllUsers, findUserByEmail, updateUserByEmail, findUserById } from '../services/users.services.js';
import handleMongooseError from '../helpers/handle-mongoose-error.helper.js';

const getUsers = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        
        const { password, ...userData } = user.toObject();
        res.status(200).json(userData);
    } catch (error) {
        handleMongooseError(error, res);
    }
};

const updateUser = async (req, res) => {
    try {
        const { email } = req.params;
        const updatedUser = await updateUserByEmail(email, req.body);
        if (!updatedUser) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// NUEVA FUNCIÓN: Obtiene el usuario basándose en el token
const getUserProfile = async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const { password, ...userData } = user.toObject();
        res.status(200).json(userData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { getUsers, getUserByEmail, updateUser, getUserProfile };