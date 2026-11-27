import asyncHandler from '../helpers/async-handler.helper.js';
import { assertFound } from '../helpers/http-error.helper.js';
import { buildVisibilityFilter, parseStatusBody } from '../helpers/visibility.helper.js';
import {
    dbCreateProduct,
    dbDeleteProduct,
    dbGetProduct,
    dbGetProducts,
    dbGetPublicProducts,
    dbSetProductStatus,
    dbUpdateProduct
} from '../services/products.services.js';

const NOT_FOUND = 'Producto no encontrado';

const createProduct = asyncHandler(async (req, res) => {
    // El creador es el usuario autenticado, no el que venga en el body
    const data = await dbCreateProduct({ ...req.body, createdBy: req.userFound._id });

    res.status(201).json({ msg: 'Registrar producto', data });
}, 'No se pudo registrar el producto');

const getProduct = asyncHandler(async (req, res) => {
    res.json({ msg: 'Obtiene un producto', data: assertFound(await dbGetProduct(req.params.id), NOT_FOUND) });
}, 'No se pudo obtener el producto por ID');

// Gestión: ?status=true|false|all (por defecto all)
const getProducts = asyncHandler(async (req, res) => {
    const data = await dbGetProducts(buildVisibilityFilter(req.query.status));

    res.json({ msg: 'Listar total o parcialmente los productos', data });
}, 'No se pueden listar el total o parcialmente los productos');

// Carta para clientes y visitantes: el Backend ya excluye los ocultos
const getPublicProducts = asyncHandler(async (req, res) => {
    res.json({ msg: 'Productos visibles', data: await dbGetPublicProducts() });
}, 'No se pudieron listar los productos visibles');

const updateProduct = asyncHandler(async (req, res) => {
    // La visibilidad y el autor no se cambian por aquí: hay un endpoint dedicado para el estado
    const { status, createdBy, ...changes } = req.body;
    const data = assertFound(await dbUpdateProduct(req.params.id, changes), NOT_FOUND);

    res.json({ msg: 'Producto actualizado', data });
}, 'No se ha podido actualizar');

// PATCH /:id/status  { "status": true | false }
const setProductStatus = asyncHandler(async (req, res) => {
    const status = parseStatusBody(req.body);
    const data = assertFound(await dbSetProductStatus(req.params.id, status), NOT_FOUND);

    res.json({ msg: status ? 'Producto habilitado' : 'Producto deshabilitado', data });
}, 'No se pudo cambiar el estado del producto');

const deleteProduct = asyncHandler(async (req, res) => {
    res.json({ msg: 'Elimina un producto', data: assertFound(await dbDeleteProduct(req.params.id), NOT_FOUND) });
}, 'No se ha podido eliminar el producto');

export {
    createProduct,
    getProduct,
    getProducts,
    getPublicProducts,
    updateProduct,
    setProductStatus,
    deleteProduct
};
