import { dbCreateProduct, dbDeleteProduct, dbGetProducts, dbUpdateProduct, dbGetProduct } from "../services/products.services.js";

const createProduct = async ( req, res ) => {
    try {
        // Extraer los datos del cuerpo de la peticion
        const inputData = req.body;

        // Usar el servicio para registrar
        const data = await dbCreateProduct(inputData);

        res.json({ msg: 'Registrar producto', data: data});
    } 
    catch (error) {
        console.error( error );

        res.json({ msg: 'No se pudo registrar el producto'}) 
    }

}

const getProducts = async (req, res) => {
    try {
        const query = req.params.id;

        const data = await dbGetProducts( query );

        res.json({ msg: 'Listar total o parcialmente los productos', data: data });
    } catch (error) {
        res.json({
            msg: 'No se pueden listar el total o parcialmente los productos'
        })
    }
}

const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbDeleteProduct(id);

        res.json({
            msg: 'Elimina un producto',
            data: data
        });
    } catch (error) {
        console.error( error );

        res.json({
            msg: 'No se ha podido eliminar el producto'
        })
    }
}

const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const inputData = req.body;

        const data = await dbUpdateProduct( id, inputData );

        res.json({
            msg: 'Producto actualizado',
            data: data
        });
    } catch (error) {
        console.error( error );

        res.json({
            msg: 'No se ha podido actualizar'
        })
    }
}

const getProduct = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await dbGetProduct( id );

        res.json({
            msg: 'Obtiene un producto',
            data: data
        });
    } catch (error) {
        console.error( error );
        res.json({
            msg: 'No se pudo obtener el producto por ID'
        });
    }
}

export {
    createProduct, getProducts, deleteProduct, updateProduct, getProduct
}