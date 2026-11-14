import { Schema, model } from 'mongoose';

// Secuencias numéricas 1, 2, 3… (un documento por secuencia: 'orders', 'sales', 'tickets').
// El $inc es atómico: dos peticiones simultáneas nunca reciben el mismo número.
const counterSchema = new Schema({
    _id: String,
    seq: { type: Number, default: 0 }
}, { versionKey: false });

const counterModel = model('Counter', counterSchema, 'contadores');

const nextSequence = async (name) => {
    const counter = await counterModel.findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true }
    );

    return counter.seq;
};

/**
 * Siguiente número de la secuencia que no esté usado en `field` de la colección del modelo.
 * Normalmente es una sola vuelta; el bucle solo avanza si hay documentos numerados por
 * fuera del contador (datos importados o una base sin migrar).
 */
const nextFreeSequence = async (Model, field, name) => {
    let value;

    do {
        value = await nextSequence(name);
    } while (await Model.exists({ [field]: value }));

    return value;
};

// Sube el contador hasta `value` si va por detrás (nunca lo baja). Lo usa la migración.
const raiseSequence = async (name, value) => {
    await counterModel.updateOne({ _id: name }, { $max: { seq: value } }, { upsert: true });
};

export { nextSequence, nextFreeSequence, raiseSequence };
export default counterModel;
