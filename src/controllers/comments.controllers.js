import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import {
    dbCreateComment,
    dbDeleteComment,
    dbGetComments,
    dbUpdateComment,
    dbGetComment,
    dbGetCommentByCodigo
} from "../services/comments.services.js";
import { dbReadSaleByTicket } from "../services/sales.services.js";

// CAMBIO: la creación de comentarios se valida contra el ticket de compra.
// El Frontend solo lee el QR y envía su contenido en `codigo`; toda la verificación ocurre aquí:
//   1. Quién comenta: visitante sin cuenta ('Usuario', sin token) o 'Cliente' autenticado.
//   2. El código debe corresponder al idTicketVenta de una venta registrada.
//   3. Cada ticket admite un único comentario.
const createComment = async (req, res) => {
    try {
        const { codigo, comentario } = req.body ?? {};

        // optionalAuthMiddleware deja req.userFound solo si la petición trae un token válido
        const user = req.userFound ?? null;

        if (user && user.role !== 'Cliente') {
            return res.status(403).json({ msg: `Error: El Rol ${user.role} no esta autorizado para publicar comentarios` });
        }

        // Se exige string: un objeto como { "$ne": null } en el body se convertiría en un
        // operador de consulta de Mongo y haría coincidir cualquier venta.
        if (typeof codigo !== 'string' || !codigo.trim()) {
            return res.status(400).json({ codigo: 'Debe enviar el código leído del QR del ticket de compra' });
        }

        const ticket = codigo.trim();

        const sale = await dbReadSaleByTicket(ticket);

        if (!sale) {
            return res.status(404).json({ msg: 'El código QR no corresponde a ninguna venta registrada' });
        }

        const existingComment = await dbGetCommentByCodigo(ticket);

        if (existingComment) {
            return res.status(400).json({ msg: 'Este ticket de compra ya fue utilizado para publicar un comentario' });
        }

        // Solo se pasan los campos que el cliente puede definir; usuario, venta y likes
        // los fija el Backend para que no puedan falsificarse desde el body.
        const data = await dbCreateComment({ codigo: ticket, comentario }, user ? user._id : null, sale._id);

        res.status(201).json({ msg: 'Registrar comentario', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo registrar el comentario' });
    }
}

const getComment = async (req, res) => {
    try {
        const query = req.params.id;
        const data = await dbGetComment(query);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Comentario no encontrado' });
        }

        res.json({ msg: 'Obtener comentario por ID', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se pudo obtener el comentario'
        });
    }
}

const getComments = async (req, res) => {
    try {
        const data = await dbGetComments();

        res.json({ msg: 'Listar total de comentarios', data: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'No se pueden listar los comentarios'
        });
    }
}

const updateComment = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;
        const data = await dbUpdateComment(id, inputData);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Comentario no encontrado' });
        }

        res.json({ msg: 'Actualizar comentario', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se pudo actualizar el comentario'
        });
    }
}

const deleteComment = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await dbDeleteComment(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Comentario no encontrado' });
        }

        res.json({ msg: 'Eliminar comentario', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se pudo eliminar el comentario'
        });
    }
}

export {
    createComment,
    getComment,
    getComments,
    updateComment,
    deleteComment
}
