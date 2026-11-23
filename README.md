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
| **jsonwebtoken** | Autenticación con JWT (HS256, 1 hora). |
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

## 5. Guía rápida

### Flujo de autenticación

```
1. POST /api/auth/register   { name, email, password }     → crea un usuario con rol Cliente
2. POST /api/auth/login      { email, password }           → devuelve { token, data }
3. Cada petición protegida envía el token en una cabecera:
      X-Token: <token>          o          Authorization: Bearer <token>
4. El token dura 1 hora. GET /api/auth/renew-token (con el token vigente) entrega uno nuevo.
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
| GET · POST | `/api/users` | Admin | Listar (`?page&limit&state&role`) · crear usuario |
| GET · PATCH · PUT | `/api/users/:id` | Admin o el propio usuario | Ver · editar |
| DELETE | `/api/users/:id` | Admin | Eliminar (solo un Owner gestiona cuentas Owner) |
| GET | `/api/categories` · `/:id` | Personal | Listar · ver categoría |
| POST · PATCH · DELETE | `/api/categories` · `/:id` | Admin | Crear · editar · eliminar |
| GET | `/api/products/public` | Público | Carta: solo productos visibles |
| GET | `/api/products` · `/:id` | Personal | Listar (`?isActive=true\|false\|all`) · ver |
| POST · PATCH · DELETE | `/api/products` · `/:id` | Admin | Crear · editar · eliminar |
| PATCH | `/api/products/:id/status` | Admin | Mostrar / ocultar: `{ "isActive": boolean }` |
| GET | `/api/supplies` · `/:id` | Personal | Listar (`?state=Con_Stock\|Sin_Stock`) · ver insumo |
| POST · PATCH · DELETE | `/api/supplies` · `/:id` | Admin | Crear · editar · eliminar |
| POST | `/api/orders` | Personal | Crear pedido: `{ items: [{ productId, quantity }] }` |
| GET | `/api/orders` · `/:id` | Personal | Listar (`?estado=`) · ver |
| POST | `/api/orders/:id/items` | Personal | Añadir productos a un pedido abierto |
| PATCH · PUT | `/api/orders/:id` | Personal | Cambiar solo el `estado` |
| DELETE | `/api/orders/:id` | Admin | Eliminar (si no tiene venta) |
| POST | `/api/sales` | Personal | Registrar venta: con `orderId` (de un pedido) o directa con `items` |
| GET | `/api/sales` · `/:id` | Personal | Listar (`?from&to` en `YYYY-MM-DD`) · ver |
| PATCH · PUT · DELETE | `/api/sales/:id` | Admin | Corregir `fecha`, `cliente`, `direccionEntrega` · eliminar |
| GET | `/api/indicators/panel` | Admin | Panel de indicadores (`?month&compareA&compareB&yearA&yearB`) |
| GET | `/api/indicators/dashboard` · `/metrics` | Admin | Dashboard por fecha · métricas por rango |
| PUT | `/api/indicators/goal/:year` | Admin | Definir la meta anual: `{ "target": number }` |
| POST | `/api/indicators/rebuild` | Admin | Regenerar los indicadores desde las ventas |
| POST | `/api/comments` | Público o Cliente | Comentar con el código QR del ticket: `{ codigo, comentario, valoracion }` |
| GET | `/api/comments/public` | Público | Comentarios visibles |
| GET | `/api/comments` · `/:id` | Personal | Moderación: listar (`?isActive=`) · ver |
| PATCH · DELETE | `/api/comments/:id` · `/:id/status` | Admin | Editar · mostrar/ocultar · eliminar |
| POST | `/api/pqrs` | Cliente | Registrar una PQRS |
| GET | `/api/pqrs` · `/:id` | Personal | Listar · ver |
| PATCH · DELETE | `/api/pqrs/:id` | Admin | Cambiar estado · eliminar |
| GET | `/api/establecimiento` · `/api/horarios` · `/api/ubicaciones` (y `/:id`) | Personal | Consultar información del local |
| POST · PATCH · DELETE | `/api/establecimiento` · `/api/horarios` · `/api/ubicaciones` (y `/:id`) | Admin | Gestionar información del local |

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
