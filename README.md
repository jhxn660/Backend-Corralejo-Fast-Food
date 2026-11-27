# Corralejo Fast Food — Backend (API REST)

## 1. Descripción y stack tecnológico

API REST del sistema de información del restaurante **Corralejo Fast Food**. Gestiona usuarios y
roles, catálogo (categorías, productos, insumos), pedidos, ventas con ticket y QR, indicadores de
ventas, comentarios, PQRS y la información del establecimiento.

Es un proyecto **independiente**: se instala, se ejecuta y se prueba solo (con `npm test` o con la
colección de Bruno). No sirve ni depende de ninguna interfaz.

| Tecnología | Uso |
|---|---|
| **Node.js 22+** | Entorno de ejecución. Se usan `--env-file`, `--watch` y `node --test` (no hay `dotenv` ni `nodemon`). |
| **Express 5** | Servidor HTTP y enrutamiento. |
| **MongoDB + Mongoose 9** | Base de datos y modelos (validación, hooks, índices). |
| **jsonwebtoken** | Autenticación con JWT (HS256, 2 horas). |
| **bcrypt** | Hash de contraseñas. |
| **cors** | Orígenes permitidos. |
| **mongodb-memory-server** *(dev)* | MongoDB en memoria para las pruebas: nunca tocan la base real. |

## 2. Estructura de carpetas

```
Backend-Corralejo-Fast-Food/
├── src/
│   ├── index.js          Arranque: conecta Mongo y abre el puerto
│   ├── app.js            Arma Express: middlewares globales, rutas y manejo de errores
│   ├── config/           Conexión a Mongo y definición de roles
│   ├── routes/           URL + método → middlewares → controlador
│   ├── middlewares/      Autenticación, autorización, body y errores
│   ├── controllers/      Leen la petición y arman la respuesta { msg, data }
│   ├── services/         Reglas de negocio y consultas a la base de datos
│   ├── models/           Schemas de Mongoose
│   ├── dtos/             Forma de la respuesta de Indicadores
│   ├── helpers/          Utilidades: JWT, bcrypt, fechas, errores HTTP
│   └── migrations/       Migraciones de datos (npm run migrate)
├── scripts/migrate.js    Ejecuta las migraciones
├── tests/                Pruebas de integración (MongoDB en memoria)
├── bruno/                Colección de peticiones para probar la API a mano
├── .env.example          Plantilla de variables de entorno
├── ARQUITECTURA.md       Cómo funciona por dentro y por qué
└── README.md
```

El detalle de cada capa, el flujo completo de una petición y las decisiones técnicas están en
**[ARQUITECTURA.md](ARQUITECTURA.md)**.

## 3. Instalación y configuración

Requisitos: **Node.js 22 o superior** y un MongoDB (local o Atlas).

```bash
npm install
cp .env.example .env      # en Windows (PowerShell): Copy-Item .env.example .env
```

Edita `.env` con tus valores. El archivo `.env` nunca se versiona.

| Variable | Obligatoria | Para qué sirve | Ejemplo |
|---|---|---|---|
| `PORT` | No | Puerto HTTP. Si falta se usa `3001`; la colección de Bruno apunta a `3000`. | `3000` |
| `URI_MONGO` | Sí | Cadena de conexión a MongoDB. | `mongodb://localhost:27017/db_Corralejo-Fast-Food` |
| `JWT_SECRET` | Sí | Secreto con el que se firman los tokens. Sin él, el login responde 500. | *(cadena aleatoria de 64 caracteres)* |
| `CORS_ORIGIN` | No | Orígenes permitidos, separados por comas. Vacío = cualquiera (solo desarrollo). | `http://localhost:5173` |
| `BUSINESS_TIMEZONE` | No | Zona horaria con la que se agrupan las ventas por día. | `America/Bogota` |

Generar un secreto propio:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 4. Ejecución y scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | **Desarrollo.** Arranca con `--watch`: se reinicia solo al guardar un archivo. |
| `npm start` | **Producción.** Arranca una vez, sin vigilancia de archivos. |
| `npm test` | Ejecuta todas las pruebas contra un MongoDB en memoria. La primera vez descarga el binario de `mongod` (requiere internet). |
| `npm run test:flow` | Solo el ciclo completo pedido → venta. |
| `npm run migrate` | Migra identificadores de pedidos y ventas antiguos. Es idempotente: se puede repetir. |

Comprobar que está arriba: `GET http://localhost:3000/health`.

**Rendimiento con Atlas.** Cada consulta a MongoDB Atlas (AWS us-east-1) tarda ~100 ms en ir y volver,
así que una escritura que encadena consultas se nota (registrar una venta: ~1,6 s). Para desarrollar
rápido, usa un MongoDB local en `URI_MONGO` (cada consulta < 1 ms). En producción, despliega el backend
en la misma región que el clúster de Atlas. Ver [ARQUITECTURA.md](ARQUITECTURA.md), sección 3.

## 5. Guía rápida

### Flujo de autenticación

```
1. POST /api/auth/register   { name, email, password }     → crea un usuario con rol Cliente
2. POST /api/auth/login      { email, password }           → devuelve { token, data }
3. Cada petición protegida envía el token en una cabecera:
      X-Token: <token>          o          Authorization: Bearer <token>
4. El token dura 2 horas. GET /api/auth/renew-token (con el token vigente) entrega uno nuevo; el frontend lo pide después de cada petición al backend.
```

- **401** = no se sabe quién eres (falta el token, venció o el usuario está inactivo) → iniciar sesión.
- **403** = se sabe quién eres, pero tu rol no puede hacer eso.
- La contraseña exige de 7 a 60 caracteres, con mayúscula, minúscula, número y símbolo.

**Roles** (de mayor a menor): `Owner` > `Administrador` > `Empleado` > `Cliente`. En la tabla:
**Admin** = Owner y Administrador · **Personal** = Admin + Empleado · **Público** = sin token.

### Endpoints principales

Todas las respuestas correctas tienen la forma `{ msg, data }`; los errores, `{ msg }` (o
`{ campo: mensaje }` en los de validación).

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado del servidor |
| POST | `/api/auth/register` | Público | Registro (siempre como Cliente) |
| POST | `/api/auth/login` | Público | Inicio de sesión: devuelve el token |
| GET | `/api/auth/renew-token` | Con token | Renueva el token |
| GET · POST | `/api/users` | Admin | Listar (`?page&limit&status&role`; `status` = `true`, `false` o `all`, por defecto `all`) · crear usuario |
| GET · PATCH | `/api/users/:id` | Admin o el propio usuario | Ver · editar |
| DELETE | `/api/users/:id` | Admin | Eliminar (solo un Owner gestiona cuentas Owner) |
| GET | `/api/categories` · `/:id` | Personal | Listar · ver categoría |
| POST · PATCH · DELETE | `/api/categories` · `/:id` | Admin | Crear · editar · eliminar |
| GET | `/api/products/public` | Público | Carta: solo productos visibles, con `rating` { score 1-5, count } de los comentarios por QR |
| GET | `/api/products` · `/:id` | Personal | Listar (`?status=true\|false\|all`) · ver |
| POST · PATCH · DELETE | `/api/products` · `/:id` | Admin | Crear · editar · eliminar. Combo = producto con `comboItems` [{ product, quantity }] y `comboPriceMode` `sum` (suma de sus productos) o `custom` |
| PATCH | `/api/products/:id/status` | Admin | Mostrar / ocultar: `{ "status": boolean }` |
| GET | `/api/supplies` · `/:id` | Personal | Listar (`?status=Con_Stock\|Sin_Stock`) · ver insumo |
| POST · PATCH · DELETE | `/api/supplies` · `/:id` | Admin | Crear · editar · eliminar (incluye `minStock`, el stock mínimo de reposición) |
| GET | `/api/recipes` · `/:id` | Personal | Recetas: qué insumos gasta cada producto |
| POST · PATCH · DELETE | `/api/recipes` · `/:id` | Admin | Crear `{ product, items: [{ supply, quantity }] }` · cambiar `items` · eliminar |
| POST | `/api/orders` | Personal | Crear pedido: `{ items: [{ productId, quantity }] }` |
| GET | `/api/orders` · `/:id` | Personal | Listar (`?estado=`) · ver |
| POST | `/api/orders/:id/items` | Personal | Añadir productos a un pedido abierto |
| PUT | `/api/orders/:id/items` | Personal | Reemplazar la lista completa de productos de un pedido abierto (quitar y cambiar cantidades) |
| PATCH | `/api/orders/:id` | Personal | Cambiar solo el `estado` |
| DELETE | `/api/orders/:id` | Admin | Eliminar (si no tiene venta) |
| POST | `/api/sales` | Personal | Registrar venta: con `orderId` (de un pedido) o directa con `items`. Descuenta los insumos de las recetas (409 `missingSupplies` si no alcanzan) |
| GET | `/api/sales` | Público o Personal | Listar (`?from&to` en `YYYY-MM-DD`). El personal recibe la venta completa; sin token (o con otro rol) solo `fecha`, `estadoPedido` y producto + cantidad de cada línea, para contar lo más vendido |
| GET | `/api/sales/:id` | Personal | Ver una venta |
| PATCH · DELETE | `/api/sales/:id` | Admin | Corregir `fecha`, `cliente`, `direccionEntrega` · eliminar |
| GET | `/api/indicators/panel` | Admin | Panel de indicadores (`?month&compareA&compareB&yearA&yearB`) |
| GET | `/api/indicators/dashboard` · `/metrics` | Admin | Dashboard por fecha · métricas por rango |
| PUT | `/api/indicators/goal/:year` | Admin | Definir la meta anual: `{ "target": number }` |
| POST | `/api/indicators/rebuild` | Admin | Regenerar los indicadores desde las ventas |
| POST | `/api/comments` | Público o Cliente | Comentar con el código QR del ticket: `{ codigo, comentario, calificacion (1-5) o valoracion (1-10) }` |
| GET | `/api/comments/public` | Público | Comentarios visibles; con token, cada uno trae `likedByMe` |
| POST · DELETE | `/api/comments/:id/like` | Admin y Cliente | Dar · quitar "me gusta" (uno por persona; repetir no suma ni resta) |
| GET | `/api/comments` · `/:id` | Personal | Moderación: listar (`?status=`) · ver |
| PATCH · DELETE | `/api/comments/:id` · `/:id/status` | Admin | Editar · mostrar/ocultar · eliminar |
| POST | `/api/pqrs` | Cliente | Registrar una PQRS: `{ tipo, asunto, descripcion }` |
| GET | `/api/pqrs/mine` | Cliente | Sus propias PQRS, con la respuesta del restaurante |
| GET | `/api/pqrs` · `/:id` | Personal | Listar · ver |
| PATCH · DELETE | `/api/pqrs/:id` | Admin | Responder y cambiar estado: `{ estado?, respuesta? }` · eliminar |
| GET | `/api/establecimiento` · `/api/horarios` · `/api/ubicaciones` · `/api/cierres` (y `/:id`) | Público | Consultar información del local |
| POST · PATCH · DELETE | `/api/establecimiento` · `/api/horarios` · `/api/ubicaciones` · `/api/cierres` (y `/:id`) | Admin | Gestionar información del local. `/api/cierres` `{ fecha: "AAAA-MM-DD", estaAbierto?, horaApertura?, horaCierre?, motivo? }` define UNA fecha (cerrada por defecto, o abierta con su propio horario "HH:MM") sin tocar el horario semanal |

### Flujo de negocio principal

```
Pedido (En preparación ⇄ Listo → Entregado)
   │  POST /api/sales { orderId }
   ▼
Venta (el pedido pasa a Finalizado; se asignan saleId, ticketId y qr)
   │  automático
   ▼
Indicadores del día (se recalculan con cada venta creada, editada o eliminada)
   │  el cliente escanea el QR del ticket
   ▼
Comentario (POST /api/comments { codigo: <qr> } — uno por ticket)
```

### Probar la API con Bruno

Abre la carpeta `bruno/Sample API Collection` en [Bruno](https://www.usebruno.com/). Cada carpeta
corresponde a un recurso de la tabla anterior. Inicia sesión primero y usa el token devuelto.

## 6. Nombres de campos (convención del FrontEnd de referencia)

| Modelo | Antes | Ahora |
|---|---|---|
| Producto | `nombre`, `isActive`, `state` (logístico) | `name`, `status` (visible u oculto), `images: [{ url, isMain }]`; sin `state` |
| Usuario | `state` | `status` (activo o inactivo) |
| Comentario | `isActive` | `status` (visible u oculto) |
| Insumo | `state` | `status` (`Con_Stock` / `Sin_Stock`) |

Los filtros y cuerpos siguen el mismo nombre: `?status=` y `PATCH /:id/status { "status": boolean }`.
