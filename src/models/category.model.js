import { Schema, model} from "mongoose";

// Definir la estructura de mi documento
const CategorySchema = new Schema(
    // Definir la estructura de datos
    {
        name: {
            type: String,
            minlenght: 3,
            unique: true,
        },
        description: {
            type: String,
            require: false,
        },
        status: {
            type: Boolean,
            default: true
        }

    },
    // Configuraciones de la estructura de datos
    {
        timestamps: true,   // Agrega los campos createdAt, updatedAt automaticamente
        versionKey: false   // Elimina la promiedad de versonamineto __v del Schema
    }
);

// Definir el modelo a partir de la estructura del documento
const CategoryModel = model(
    'category',     // Nombre de la coleccion donde se guardaran los documentos de tipo categoria
    CategorySchema  // Schema (estructura de datos) que se guardara en coleccion
);

// Exportamos el modelo para que pueda ser usado por los servicios
export default CategoryModel;