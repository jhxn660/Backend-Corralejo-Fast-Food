//Captura y formatea los errores que devuelve MongoDB para que sean legibles en el frontend.


const handleMongooseError = (error, res) => {
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ error: messages });
    }
    if (error.code === 11000) {
        return res.status(400).json({ error: 'El registro ya existe (duplicado)' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
};

export default handleMongooseError;