export const validarInformacion = (data) => {
    if (!data.titulo || !data.contenido) {
        throw new Error('El título y el contenido son obligatorios para la información.');
    }
};

export const validarHorario = (data) => {
    if (!data.dia || !data.apertura || !data.cierre) {
        throw new Error('Los campos día, apertura y cierre son obligatorios.');
    }
};

export const validarUbicacion = (data) => {
    if (!data.direccion || !data.ciudad) {
        throw new Error('La dirección y la ciudad son obligatorias.');
    }
};