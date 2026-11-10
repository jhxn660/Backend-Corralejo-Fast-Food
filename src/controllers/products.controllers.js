import handleMongooseError from "../helpers/handle-mongoose-error.helper.js";
import { dbCreateProduct, dbDeleteProduct, dbGetProducts, dbUpdateProduct, dbGetProduct } from "../services/products.services.js";

const createProduct = async ( req, res ) => {
    try {
        // Extrae el ID del usuario
        const { _id } = req.userFound;

        // Extraer los datos del cuerpo de la peticion
        const inputData = req.body;
        inputData.createdBy = _id;

        // Usar el servicio para registrar
        const data = await dbCreateProduct(inputData);

        res.status(201).json({ msg: 'Registrar producto', data: data});
    }
    catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({ msg: 'No se pudo registrar el producto' });
    }

}

const getProduct = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbGetProduct( id );

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        res.json({
            msg: 'Obtiene un producto',
            data: data
        });
    } catch (error) {
        console.error( error );

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se pudo obtener el producto por ID'
        });
    }
}

const getProducts = async (req, res) => {
    try {
        const query = req.params.id;

        const data = await dbGetProducts( query );

        res.json({ msg: 'Listar total o parcialmente los productos', data: data });
    } catch (error) {
        console.error(error);

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se pueden listar el total o parcialmente los productos'
        })
    }
}

const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;

        const data = await dbUpdateProduct( id, inputData );

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        res.json({
            msg: 'Producto actualizado',
            data: data
        });
    } catch (error) {
        console.error( error );

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se ha podido actualizar'
        })
    }
}

const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteProduct(id);

        // CAMBIO: Mongoose devuelve null (no lanza error) si el ID no existe; se responde 404 en vez de 200 con data null
        if (!data) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        res.json({
            msg: 'Elimina un producto',
            data: data
        });
    } catch (error) {
        console.error( error );

        // Errores de persistencia (validación de Schema, duplicidad, ObjectId inválido) → 400
        const validationErrors = handleMongooseError(error);
        if (validationErrors) {
            return res.status(400).json(validationErrors);
        }

        res.status(500).json({
            msg: 'No se ha podido eliminar el producto'
        })
    }
}

export {
    createProduct, getProduct, getProducts, updateProduct, deleteProduct
}
