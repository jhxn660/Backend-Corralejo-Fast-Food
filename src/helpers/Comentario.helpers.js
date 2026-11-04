export const validarComentario = (data) => {
    if (!data.codigo || !data.comentario) {
        throw new Error('El código y el comentario son obligatorios.');
    }
};