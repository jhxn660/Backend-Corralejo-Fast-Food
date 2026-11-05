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

        res.json({ msg: 'Registrar producto', data: data});
    } 
    catch (error) {
        console.error(error);

        if( error.name == 'ValidationError') {
            const errors = {};

            // Iterar los errores
            for( const field in error.errors){
                errors[field] = error.errors[field].message;
            }
            res.json({ errors });
        }

        // Verificar si el error es por duplicidad 
        if(error.code == 11000){
            //console.log('>1>>>', error.keyValue );
            //console.log('>2>>>', Object.keys(error.keyValue));
            //console.log('>3>>>', Object.keys(error.keyValue)[0]);
            const field = Object.keys(error.keyValue)[0];

            // Mensaje de error que se envia al cliente
            return res.json({
                msg: `Error por duplicidad en el campo '${field}'`,
                [field]: `El campo '${ field }' con el valor '${ error.keyValue[ field ]}', ya se encuentra registrado`
            });
        }

        res.json({ msg: 'No se pudo registrar el producto' });
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

        console.log( 'ID: ', id );

        // Verificar formato del ID
        if( error.name === 'CastError' ) {
            return res.json({
                msg: `El ID debe tener 24 caracteres y el enviad tiene ${id.lenght}`,
                [error.path]: `El identificador ${ error.value } no tiene el formato valido que requiere MongoDB`
            });
        }

        res.json({
            msg: 'No se pudo obtener el producto por ID'
        });
    }
}

export {
    createProduct, getProducts, deleteProduct, updateProduct, getProduct
}