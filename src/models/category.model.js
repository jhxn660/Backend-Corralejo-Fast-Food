import { Schema, model } from 'mongoose';

// Definir la estructura de mi documento
const CategorySchema = new Schema(
    {
        name: {
            type: String,
            minlength: [4, 'El nombre de la categoria debe tener al menos 3 caracteres.'],
            unique: true,
            required: [true, 'El nombre de la categoria es obligatorio.']
        },
        description: {
            type: String,
            required: false
        },
        status: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    // Configuraciones de la estructura de datos
    {
        timestamps: true,  // Agrega los campos createdAt, updatedAt automaticamente
        versionKey: false  // Elimina la propiedad de versionamiento __v del Schema
    }
);

// Definir el modelo a partir de la estructura del documento
const CategoryModel = model(
    'category',     // Nombre de la coleccion donde se guardaran los documentos
    CategorySchema  // Schema que se guardara en la coleccion
);

// Exportamos el modelo para que pueda ser usado por los servicios
export default CategoryModel;