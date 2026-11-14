import mongoose from 'mongoose';
import { HttpError } from './http-error.helper.js';

/**
 * Valida la forma de `items` ([{ productId, quantity }]) y une las líneas repetidas del mismo
 * producto. Solo se leen productId y quantity: el precio, el nombre o el subtotal que envíe el
 * cliente se descartan, porque el servidor los toma del catálogo (ver order-details.services).
 *
 * @returns {{ productId: string, quantity: number }[]}
 */
const parseItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new HttpError(400, 'Debes enviar al menos un producto en "items"', {
            items: 'Formato esperado: [{ "productId": "<_id del producto>", "quantity": 1 }]'
        });
    }

    const errors = {};
    const quantities = new Map();

    items.forEach((item, index) => {
        const { productId, quantity } = item ?? {};
        // Se exige texto de 24 hex: un objeto como { "$ne": null } se volvería un operador de consulta
        const validId = typeof productId === 'string' && mongoose.isObjectIdOrHexString(productId);
        const validQuantity = Number.isInteger(quantity) && quantity >= 1;

        if (!validId) errors[`items[${index}].productId`] = 'Debe ser el _id de un producto';
        if (!validQuantity) errors[`items[${index}].quantity`] = 'Debe ser un número entero mayor o igual a 1';
        if (validId && validQuantity) quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    });

    if (Object.keys(errors).length) {
        throw new HttpError(400, 'Hay productos inválidos en "items"', errors);
    }

    return [ ...quantities ].map(([ productId, quantity ]) => ({ productId, quantity }));
};

export { parseItems };
