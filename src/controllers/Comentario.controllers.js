import { 
    dbCreateComentario, 
    dbDeleteComentario, 
    dbGetComentarios, 
    dbUpdateComentario, 
    dbGetComentario 
} from "../services/Comentario.services.js";

const createComentario = async (req, res) => {
    try {
        // 1. Obtenemos el ID del usuario autenticado a través del token
        const usuarioId = req.usuario ? req.usuario._id : req.uid;

        // 2. Llamamos al servicio pasándole el body y el id del usuario por separado
        const data = await dbCreateComentario(req.body, usuarioId);

        res.json({ msg: 'Registrar comentario', data: data });
    } catch (error) {
        console.error(error);

        if(error.name === 'ValidationError') {
            const errors = {};
            for( const field in error.errors ) {
                errors[field] = error.errors[field].message;
            }
            return res.json({ errors });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.json({
                msg: `Error por duplicidad en el campo '${field}'`,
                error: `El campo '${field}' con el valor '${error.keyValue[field]}' ya se encuentra registrado.`
            });
        }

        res.json({ msg: 'No se pudo registrar el comentario' });
    }
}

const getComentarios = async (req, res) => {
    try {
        const data = await dbGetComentarios();

        res.json({ msg: 'Listar total de comentarios', data: data });
    } catch (error) {
        console.error(error);
        res.json({
            msg: 'No se pueden listar los comentarios'
        });
    }
}

const getComentario = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetComentario(query);

        res.json({ msg: 'Obtener comentario por ID', data: data });
    } catch (error) {
        console.error(error);
        res.json({
            msg: 'No se pudo obtener el comentario'
        });
    }
}

const updateComentario = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdateComentario(id, inputData);

        res.json({ msg: 'Actualizar comentario', data: data });
    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.json({
                msg: `Error por duplicidad en el campo '${field}'`,
                error: `El campo '${field}' con el valor '${error.keyValue[field]}' ya se encuentra registrado.`
            });
        }

        res.json({
            msg: 'No se pudo actualizar el comentario'
        });
    }
}

const deleteComentario = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeleteComentario(id);

        res.json({ msg: 'Eliminar comentario', data: data });
    } catch (error) {
        console.error(error);
        res.json({
            msg: 'No se pudo eliminar el comentario'
        });
    }
}

export {
    createComentario,
    getComentarios,
    getComentario,
    updateComentario,
    deleteComentario
}