import { Schema, model } from "mongoose";

// Definir la estructura del documento
const CategorySchema = new Schema(
    // Definir la estructura de dats
    {
        nombre: {
            type: String,
            unique: true,
            minLength: 5
        },
        descripcion: String,
        status: {
            type:Boolean,
            default: true
        }
    }, 
    // Cnfiguraciones de la estructura de datos
    {
        timestamps: true,       // Agrega los campos createdAt, UpdateAt automaticamente 
        versionKey: false       // Elimina la propiedad de versionamineto del schema
    }
);

// Definir el model a partir de la estructura del documento
const CategoryModel = model( 
    'category',     // Nombre de la coleccion donde se guardaran los documenos de tipo categoria 
    CategorySchema  // Schema (estructura de datos) que se guardaran en coleccion
);

// Exportamos el modelo para que se pueda ser usado por los servicios
export default CategoryModel;