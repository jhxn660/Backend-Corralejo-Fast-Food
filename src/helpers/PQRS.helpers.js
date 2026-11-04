export const validarPQRS = (data) => {
    if (!data.tipo || !data.asunto || !data.descripcion) {
        throw new Error('El tipo, el asunto y la descripción de la PQRS son obligatorios.');
    }
};