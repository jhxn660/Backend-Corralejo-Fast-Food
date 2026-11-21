import mongoose from 'mongoose';
import { HttpError } from './http-error.helper.js';

/**
 * Valida la forma de `items` ([{ productId, quantity, combo? }]) y une las líneas repetidas del
 * mismo producto. El mismo plato solo y en combo son DOS líneas distintas (precios distintos).
 * Con `allowEmpty` acepta una lista vacía: sirve para vaciar un pedido abierto. Solo se leen productId y quantity: el precio, el nombre o el subtotal que envíe el
 * cliente se descartan, porque el servidor los toma del catálogo (ver order-details.services).
 *
 * @returns {{ productId: string, quantity: number, combo: boolean }[]}
 */
const parseItems = (items, { allowEmpty = false } = {}) => {
    if (!Array.isArray(items) || (items.length === 0 && !allowEmpty)) {
        throw new HttpError(400, 'Debes enviar al menos un producto en "items"', {
            items: 'Formato esperado: [{ "productId": "<_id del producto>", "quantity": 1 }]'
        });
    }

    const errors = {};
    const quantities = new Map();

    items.forEach((item, index) => {
        const { productId, quantity } = item ?? {};
        const combo = item?.combo === true;
        // Se exige texto de 24 hex: un objeto como { "$ne": null } se volvería un operador de consulta
        const validId = typeof productId === 'string' && mongoose.isObjectIdOrHexString(productId);
        const validQuantity = Number.isInteger(quantity) && quantity >= 1;

        if (!validId) errors[`items[${index}].productId`] = 'Debe ser el _id de un producto';
        if (!validQuantity) errors[`items[${index}].quantity`] = 'Debe ser un número entero mayor o igual a 1';
        // La clave une productId y combo: "Hamburguesa" y "Hamburguesa (combo)" no se suman entre sí
        const key = `${productId}|${combo}`;
        if (validId && validQuantity) quantities.set(key, (quantities.get(key) ?? 0) + quantity);
    });

    if (Object.keys(errors).length) {
        throw new HttpError(400, 'Hay productos inválidos en "items"', errors);
    }

    return [ ...quantities ].map(([ key, quantity ]) => {
        const [ productId, combo ] = key.split('|');

        return { productId, quantity, combo: combo === 'true' };
    });
};

export { parseItems };
