# Arquitectura interna — Backend Corralejo Fast Food

Guía de funcionamiento interno. Para *qué* hace cada endpoint, ver el [README](README.md) y la
colección de Bruno; aquí está el *cómo* y el *por qué*.

Este proyecto es **independiente del Frontend**: no lo importa, no lo sirve y no depende de él.
Se prueba completo con `npm test` o con la colección de Bruno.

---

## 0. Patrón arquitectónico y mapa del código

### 0.1 Patrón: arquitectura en capas

Es una **API REST con arquitectura en capas** (una variante de MVC sin "V": la vista es el JSON).
Cada capa tiene **una sola responsabilidad** (*Separación de Responsabilidades*, SoC) y solo conoce
a la capa que tiene debajo:

```
        Petición HTTP
              │
   ┌──────────▼──────────┐
   │ routes              │  ¿Qué URL y método?  ¿Quién puede entrar?
   ├─────────────────────┤
   │ middlewares         │  Autenticar (401) · Autorizar (403) · preparar el body
   ├─────────────────────┤
   │ controllers         │  Leer req, validar la FORMA de la entrada, armar { msg, data }
   ├─────────────────────┤
   │ services            │  Reglas de negocio y consultas. No conocen req/res
   ├─────────────────────┤
   │ models              │  Schemas de Mongoose: tipos, validación, hooks, índices
   └──────────┬──────────┘
              ▼
           MongoDB
```

**Regla de dependencias:** `routes → controllers → services → models`. Nunca al revés. Un servicio
puede usar otro servicio (ventas → indicadores) y un controlador nunca toca un modelo directamente.

Por qué sirve: si cambia una regla de negocio se toca **un** servicio; si cambia una URL, **una**
ruta; si cambia la forma de un dato, **un** modelo. Y cada capa se puede probar sin las demás.

### 0.2 Responsabilidad de cada carpeta

| Carpeta / archivo | Responsabilidad exacta | Qué NO hace |
|---|---|---|
| `src/index.js` | Arranque: conecta Mongo y abre el puerto. | No arma la aplicación. |
| `src/app.js` | Arma Express: CORS → JSON → body → rutas → 404 → errorHandler. Las pruebas lo importan sin abrir puerto. | No arranca el servidor. |
| `src/config/` | `mongo.config` (conexión) · `roles.config` (roles leídos del enum de `User` y sus grupos). | No tiene lógica de peticiones. |
| `src/routes/` | URL + método → `[middlewares]` → controlador. | No tiene lógica ni consultas. |
| `src/middlewares/` | `authenticate` (¿quién eres?) · `authorization` (¿puedes?) · `body` (prepara y sanea `req.body`) · `without-role` (registro público) · `error` (404 y respuesta de errores). | No aplica reglas de negocio. |
| `src/controllers/` | Lee `req`, valida la **forma** de la entrada, llama al servicio y arma `{ msg, data }`. | No consulta la BD ni usa `try/catch`. |
| `src/services/` | Reglas de negocio y consultas a la BD (funciones `db...`). | No conoce `req` ni `res`. |
| `src/models/` | Schemas de Mongoose: validación de datos, valores por defecto, hooks (totales, consecutivos) e índices. | No sabe de HTTP ni de roles. |
| `src/dtos/` | Funciones puras: números de la BD → forma que pinta la vista (solo Indicadores). | No consulta ni decide accesos. |
| `src/helpers/` | Utilidades sin estado (la capa `utils`): JWT, bcrypt, fechas de negocio, `HttpError`, `asyncHandler`, fábricas CRUD. | No guarda estado ni conoce rutas. |
| `src/migrations/` | Cambios de forma de datos ya guardados (idempotentes). Se ejecutan con `npm run migrate`. | No corre al arrancar. |
| `scripts/migrate.js` | Conecta a `URI_MONGO` y ejecuta las migraciones. | |
| `tests/` | `api.test.js` (toda la API) · `flow.test.js` (pedido → venta) · `migration.test.js`. Cada archivo usa su MongoDB en memoria. | Nunca toca Atlas. |
| `bruno/` | Colección de peticiones para probar la API a mano. | |

**Convención de nombres:** `recurso.capa.js` — `orders.routes.js`, `orders.controllers.js`,
`orders.services.js`, `order.model.js`, `jwt.helper.js`, `error.middleware.js`. El sufijo dice la
capa sin abrir el archivo. Archivos de referencia para aprender el patrón (el CRUD más simple):
`categories.routes.js` → `categories.controllers.js` → `categories.services.js` → `category.model.js`.

**Orden de los imports:** tres grupos separados por una línea en blanco, con comillas simples:
1. paquetes (`node:*`, `express`, `mongoose`…);
2. el proyecto por capas: `config` → `helpers` → `middlewares` → `models` → `dtos` →
   `migrations` → `services` → `controllers` → `routes`;
3. archivos de la misma carpeta (`./…`).

**Comentarios:** explican el *porqué* y el contrato (qué entra, qué sale, qué regla aplica) de
cómo funciona el código HOY. La historia de los cambios ("antes…", "CAMBIO:", "NUEVO:") va en
los commits, no en el código. Todo el código usa finales de línea LF.

---

## 1. Flujo de seguridad

### 1.1 Rutas protegidas: `requireRoles(ROLES)`

`requireRoles([...])` devuelve el arreglo `[authMiddleware, authorizationMiddleware(roles)]`.
Express ejecuta los elementos en orden y cada uno decide entre `next()` (sigue) o responder (corta).

```
Petición ─▶ authMiddleware ──401──▶ fin
                  │ next()
                  ▼
           authorizationMiddleware ──403──▶ fin
                  │ next()
                  ▼
             controlador
```

**authMiddleware** (`middlewares/authenticate.middleware.js`):

1. `extractToken`: toma `X-Token` o, si no está, `Authorization: Bearer <token>`.
   - Sin token → **401** `Cadena de token vacia`.
2. Comprueba que tenga 3 partes separadas por `.` (header.payload.firma). Filtra basura sin coste criptográfico.
   - Mal formado → **401**.
3. `validateToken` (`jwt.verify`): verifica firma HS256 con `JWT_SECRET` y expiración (`exp`, 2 h).
   - Firma inválida, alterado o vencido → `null` → **401** `Token invalido o inactivo`.
4. `dbGetActiveUserById(payload._id)`: **consulta a la BD en cada petición** (`{ _id, status: true }`, sin `password`).
   - Usuario eliminado o con `status: false` → **401**, aunque el token siga vigente.
5. Guarda el usuario en `req.userFound` y llama a `next()`.
6. Cualquier excepción (BD caída, `_id` corrupto) → **401** (falla cerrado, nunca deja pasar).

**authorizationMiddleware(allowedRoles)** (`middlewares/authorization.middleware.js`):

1. Lee `req.userFound.role`. Es el rol **de la BD**, no el del token: un cambio de rol aplica en la siguiente petición.
2. Sin rol → **403**. Rol fuera de la lista → **403** `El Rol X no esta autorizado`.
3. Si está permitido → `next()`.

> 401 = "no sé quién eres" (re-loguearse). 403 = "sé quién eres y no puedes" (no sirve re-loguearse).

### 1.2 Variantes

| Middleware | Dónde | Comportamiento |
|---|---|---|
| `requireSelfOrRoles(roles)` | `GET/PATCH /api/users/:id` | Autentica; pasa si el rol está en la lista **o** si `:id` es el propio `_id`. |
| `optionalAuthMiddleware` | `POST /api/comments`, `GET /api/comments/public`, `GET /api/sales` | Sin token → sigue como anónimo (`req.userFound` undefined). Con token → igual que authMiddleware; un token inválido **sí** da 401. |
| `withoutRoleMiddleware` | `POST /api/auth/register` | Sobrescribe `req.body.role = 'Cliente'`. Nadie se auto-asigna un rol desde el registro público. |
| sin middleware | `/health`, `/api/auth/login`, `/api/products/public`, lectura de `/api/establecimiento`, `/api/horarios` y `/api/ubicaciones` | Públicas. |

### 1.3 Roles

- Fuente de verdad: enum `role` de `models/user.model.js`. `config/roles.config.js` lo lee al arrancar
  y **lanza un error si falta un rol** que el código usa.
- `ADMIN_ROLES = [Owner, Administrador]` · `STAFF_ROLES = [...ADMIN_ROLES, Empleado]`.
- Reglas en controladores (no expresables en la ruta):
  - Solo un **Owner** crea, edita o elimina cuentas Owner, o asciende a alguien a Owner.
  - Quien edita su propia cuenta sin ser admin no puede cambiarse `role` ni `status`.
  - Solo un `Cliente` o un visitante comenta; el personal recibe 403.

### 1.4 Login

`POST /api/auth/login` → exige `email` y `password` **como string** (un objeto `{ "$ne": null }`
sería un operador de Mongo) → busca usuario activo por correo normalizado (`trim + lowercase`) →
`verifyPassword` (`bcrypt.compare`, asíncrono) → firma token. Correo inexistente y contraseña mala devuelven el **mismo 401**
para no revelar qué correos existen.

### 1.5 Operadores de MongoDB en el body (inyección NoSQL)

Dos ataques distintos, dos defensas:

| Ataque | Ejemplo | Dónde se corta |
|---|---|---|
| Operador de **consulta** anidado en un campo | `{ "email": { "$ne": null } }` | En cada controlador: exige `typeof valor === 'string'` → 400. |
| Operador de **actualización** en el primer nivel | `{ "$set": { "role": "Owner" } }` | `rejectMongoOperators` (`middlewares/body.middleware.js`), global en `app.js` → 400. |

El segundo existe porque los servicios actualizan con `findOneAndUpdate(filtro, body)` y Mongoose
ejecuta toda clave que empieza por `$` como una orden. El controlador quita `role` o `password`
**por nombre**, pero `$set` no se llama `role`: pasaba el filtro. Como ningún campo legítimo de la
API empieza por `$`, se rechaza en un único punto para toda la API.

---

## 2. Ciclo de vida de una petición

Ejemplo real: `POST /api/sales` con `{ "orderId": "<id>" }`.

```
1. app.js        cors() → express.json() parsea el cuerpo → ensureBody (body vacío ⇒ {})
                 → rejectMongoOperators (clave que empieza por "$" ⇒ 400)
2. app.js        app.use('/api/sales', salesRoute)
3. routes        router.post('/', requireRoles(STAFF_ROLES), createSale)
4. middlewares   authMiddleware → authorizationMiddleware            (sección 1)
5. controller    createSale = asyncHandler(async (req,res) => …)
                   ├─ orderId: ¿24 hex? (si no, 400) · items: parseItems (obligatorio sin orderId)
                   ├─ pickEditable(body): solo fecha, cliente, direccionEntrega
                   └─ dbRegisterSale({ orderId, items, fields }, req.userFound)
6. service       sales.services.dbRegisterSale → sellOrder (con orderId)
                   ├─ a la vez: orderModel.findById + saleModel.findOne({ orderId })
                   │     ¿existe? 404 · ¿ya vendido? 409 { data: venta existente }
                   ├─ ¿admite venta?                 Cancelado/Finalizado → 409
                   ├─ items → assertOrderOpen + mergeDetails + order.save()   (Entregado → 409)
                   ├─ dbAssertSuppliesAvailable      ¿alcanzan los insumos? 409 missingSupplies
                   │     (devuelve el consumo calculado para no recalcularlo al descontar)
                   ├─ findOneAndUpdate condicional   estado que admite venta → 'Finalizado' (reclamo atómico)
                   ├─ saleModel.create({ fields, líneas del pedido reclamado })
                   │     └─ model: setter de `fecha` → pre('validate') subtotales y totalPagado
                   │               → validación del Schema → pre('save') asigna saleId y ticketId
                   │                 (a la vez: son secuencias distintas) y qr
                   │               → insert → índices únicos
                   ├─ dbDiscountSupplies             todas las restas de insumos a la vez, todo o nada
                   │     (si algo falla: se borra la venta, el pedido vuelve a su estado anterior
                   │      y el error sigue su curso)
                   └─ a la vez: populate('orderId') + syncIndicators(sale.fecha)
                         └─ indicators.services.dbConsolidateDays([día])
                               ├─ 2 aggregate sobre `ventas` (totales y productos del día)
                               └─ bulkWrite upsert en `indicadores_diarios` + deleteMany de días vacíos
7. controller    res.status(201).json({ msg, data: sale, indicatorsUpdated })
```

Si algo lanza en 5–6, `asyncHandler` lo atrapa y llama a `next(error)`, y Express salta directo
a `errorHandler` (`middlewares/error.middleware.js`), que decide el código:

| Error | Respuesta |
|---|---|
| `HttpError` (lanzado a propósito) | su `status` + `{ msg, ...details }` |
| JSON mal formado (`entity.parse.failed`) | 400 |
| `ValidationError` / 11000 duplicado / `CastError` de Mongoose | 400 `{ campo: mensaje }` |
| `VersionError` (otro proceso guardó el documento entre la lectura y el `save()`) | 409 |
| Cualquier otro | 500 `{ msg: fallbackMessage }` + `console.error` |

Ruta inexistente → `notFoundHandler` → 404 JSON.

### Contrato de respuestas (para el Frontend)

- Éxito: siempre `{ msg, data }`. Login y renew-token añaden `token`. Escrituras de ventas añaden `indicatorsUpdated`.
- Error: `{ msg }`; los de validación: `{ campo: mensaje }`.
- Excepción histórica: `/api/indicators/{kpis,goal,comparison,productRows,ranking,reviews}`
  devuelven la sección **sin envoltorio** (contrato anterior). La vista actual debe usar `/api/indicators/panel`.

---

## 3. Asincronía y promesas

No hay `.then()` en el backend: todo es `async/await`. Por capa:

| Capa | Qué se espera | Cómo se captura el error |
|---|---|---|
| `index.js` | `conexion()` **sin await** (ver punto ciego 1) | try/catch interno: solo registra |
| `authMiddleware` | `await dbGetActiveUserById` | try/catch propio → 401 |
| `authorization*` | nada (síncrono) | — |
| Controladores | `await servicio(...)` | `asyncHandler`: `try { await handler } catch (e) { next(e) }` |
| Servicios | `await Model.find/create/aggregate...` | No capturan: el error sube al controlador. **Excepción:** `syncIndicators` |
| Hooks de modelo | `pre('validate', async function)` | Mongoose espera la promesa; si rechaza, `save()` rechaza |

Detalles:

- **Las consultas de Mongoose son "thenables", no promesas.** `Model.find()` arma la consulta y no
  hace nada hasta que se hace `await` (o `.exec()`). Por eso se pueden encadenar `.populate().sort()`
  antes de esperar.
- **Paralelismo:** donde las consultas no dependen entre sí se usa `Promise.all`. Si una rechaza,
  `Promise.all` rechaza con ese error y las demás siguen corriendo, pero se ignoran. Dónde se usa:
  - lecturas: listado + conteo de usuarios; las 8 consultas del panel; las 2 agregaciones de consolidación;
  - pedidos: `dbFindOrderWithSale` lee el pedido y comprueba si tiene venta a la vez (añadir,
    reemplazar, cambiar estado y eliminar);
  - ventas: pedido + venta existente; `saleId` + `ticketId`; las restas y devoluciones de insumos;
    resolver el pedido + consolidar; al eliminar una venta o cancelar su pedido, devolver insumos,
    reabrir el pedido y reconsolidar;
  - catálogo: productos de un combo + receta propia; guardar los combos cuyo precio se recalcula;
    producto + insumos al validar una receta;
  - comentarios: venta del QR + comentario que ya lo usó.
- **Por qué importa: la latencia de Atlas.** El clúster está en AWS us-east-1 y cada consulta tarda
  ~100 ms en ir y volver. Cada `await` en fila suma esa espera; dos consultas en un `Promise.all` cuestan
  una sola. Con un id de formato inválido, `dbFindOrderWithSale` no adelanta la segunda consulta: así el
  `CastError` (y su mensaje) es el mismo de siempre. Los errores se siguen revisando en el mismo orden
  que antes (por ejemplo: 404 del pedido antes que 409 de venta existente).
- **Lo que se deja en fila a propósito:** la consulta del usuario en `authMiddleware` (un usuario
  desactivado queda fuera al instante) y los pasos que dependen del anterior (validar → reclamar →
  crear → descontar). Los combos se guardan con `save()` y no con `bulkWrite`, porque `bulkWrite` se
  salta las validaciones y los hooks de Mongoose.
- **`syncIndicators` traga el error a propósito:** la venta ya está guardada, así que un fallo al
  consolidar no debe convertir la respuesta en 500. Devuelve `false`, la API responde
  `indicatorsUpdated: false` y el día se corrige con la siguiente venta o con `POST /api/indicators/rebuild`.
- **Express 5** ya reenvía al errorHandler las promesas rechazadas de un handler. `asyncHandler` se
  mantiene para adjuntar el mensaje de 500 específico de cada operación (`fallbackMessage`).
- **bcrypt es asíncrono** (`bcrypt.hash` / `bcrypt.compare` en `bcrypt.helper.js`, coste 9): el
  cálculo corre en el pool de hilos de libuv y un login no frena las demás peticiones. **JWT es
  síncrono** (`jwt.sign/verify` sin callback): tarda microsegundos.
- **Sin transacciones:** crear venta + consolidar son dos escrituras independientes. Lo que da
  consistencia es que la consolidación **recalcula** el día (idempotente) en vez de sumar.

---

## 4. Puntos ciegos (lo que pasa sin que se vea)

### Arranque y entorno
1. **Buffering de Mongoose.** El servidor responde aunque Mongo no haya conectado: las consultas se
   encolan y, si no conecta en 10 s, fallan con 500 (`buffering timed out`).
2. **`node --env-file .env`** carga el `.env` (no hay `dotenv`). `npm run dev` añade `--watch`, que reinicia
   al guardar. Sin `.env`, `JWT_SECRET` es `undefined` y el login responde 500.
3. **Roles al arrancar.** Si alguien cambia el enum de `User` y quita un rol que el código usa, el
   servidor no arranca (falla rápido a propósito).
4. **CORS abierto** si `CORS_ORIGIN` está vacío. En producción, definirlo.

### Mongoose
5. **`unique` no es un validador**: crea un índice en MongoDB. El duplicado llega como error 11000
   (sin el mensaje del Schema). Los índices se crean al conectar (`autoIndex`). **Si los datos ya
   violan un unique nuevo, el índice no se crea y la regla no se aplica**, solo queda un aviso en
   consola. Caso concreto: `saleId`, `ticketId` y `qr` son únicos; en una base sin migrar
   las ventas antiguas no los tienen y el índice no se crea. Por eso existe `npm run migrate` (sección 5).
6. **Campos que no están en el Schema se descartan en silencio** (modo `strict`). Un typo en el body
   no da error: simplemente no se guarda.
7. **`findOneAndUpdate` no ejecuta hooks de `save`/`validate`** y con `runValidators` solo valida los
   campos enviados (un `required` ausente no salta). Por eso pedidos y ventas se editan con
   `findById` + `set` + `save()`: así se recalculan subtotales y total.
8. **Nombres de colección:** algunos modelos fijan el nombre (`pedidos`, `ventas`, `comentarios`,
   `insumos`, `informacions`, `indicadores_diarios`, `metas_ventas`, `contadores`); el resto lo pluraliza
   Mongoose (`users`, `categories`, `products`, `pqrs`, `horarios`, `ubicacions`).
9. **`populate` con proyección** (`'name email role'`): sin ella, un populate a `User` devolvería
   el hash de la contraseña.

### Reglas automáticas de negocio
10. **Pedido.** El cliente solo envía `items: [{ productId, quantity }]`.
    - `parseItems` (helper) valida la forma y une las líneas repetidas. `dbBuildDetails`
      (`order-details.services.js`) toma **nombre y precio del catálogo** (solo productos visibles) y los
      copia en la línea: el pedido conserva el precio con el que se pidió aunque el catálogo cambie.
    - `pre('validate')`: `subtotal = cantidad × precio_unitario` y `totalPedido = Σ subtotales`.
      `subtotal` es `required`, pero el valor del cliente nunca llega al modelo.
    - `orderNumber` sale de la colección `contadores` con un `$inc` atómico.
    - **Añadir productos** (`POST /api/orders/:id/items`): solo si el estado es `En preparación` o `Listo`
      y el pedido no tiene venta (si no, 409). Producto ya presente → suma la cantidad y **conserva su
      precio**; producto nuevo → línea con el precio actual. `PATCH /:id` solo cambia `estado`
      (con `items` o `detalles` → 400).
    - **Concurrencia.** El Schema usa `optimisticConcurrency`: cada `save()` exige que `__v` no haya
      cambiado desde la lectura. Si dos cajas añaden a la vez, la segunda recibe 409 y reintenta; nunca se
      pierde un producto en silencio.
11. **Venta** (`sales.services.js`, `sale.model.js`). Asigna `saleId`, `ticketId` y `qr` (sección 5).
    - **Con `orderId`** (`sellOrder`): el pedido debe existir (404), no tener venta y estar en
      `En preparación`, `Listo` o `Entregado` (si no, 409). `items` es opcional: son productos de último
      momento que **primero entran al pedido** (solo si está abierto), así pedido y venta coinciden.
      Luego un `findOneAndUpdate` condicional pasa el pedido a `Finalizado`: es atómico, así que si dos
      cajas venden a la vez solo una lo consigue (la otra, 409). La venta copia las líneas del pedido.
    - **Sin `orderId`**: venta directa; `items` obligatorio, precios del catálogo (`dbBuildDetails`).
    - `totalPagado` = Σ subtotales, siempre del servidor (hoy no hay domicilio ni descuentos; si se
      agregan, deben ser campos propios calculados en el servidor, no un total libre).
    - Del body solo se aceptan `fecha`, `cliente` y `direccionEntrega`. `empleadoResponsable` sale del token.
    - **Una venta registrada no se edita**: `PATCH` con `detalles`, `items`, `totalPagado` o `estadoPedido`
      → 400. Para corregirla se cancela su pedido (o se elimina la venta) y se registra otra.
    - **Sin transacciones.** Si crear la venta falla después del reclamo, el pedido vuelve a su estado
      anterior (compensación). Si el proceso muere justo entre el reclamo y la venta, el pedido queda
      `Finalizado` sin venta: se detecta con `{ estado: 'Finalizado' }` sin venta en `ventas`. Con Atlas
      (réplica) se puede envolver todo en `session.withTransaction()` para eliminar esa ventana.
12. **Fecha de negocio.** `fecha` se guarda en UTC. Un texto sin zona (`"2026-11-12 13:00"`) se
    interpreta en `BUSINESS_TIMEZONE` (Bogotá) mediante el setter `parseBusinessDate`. Los indicadores
    agrupan por día **de Bogotá**: una venta a las 20:30 cuenta ese día aunque en UTC ya sea el siguiente.
13. **Estados y cascada.** `En preparación ⇄ Listo → Entregado → Finalizado → Cancelado` (y `Cancelado`
    desde cualquiera). `Finalizado` solo lo asigna `POST /api/sales` (crear o editar un pedido con ese
    estado → 400). Un pedido vendido solo puede pasar a `Cancelado` (otro → 409), y eso es definitivo.
    Cambiar `estado` de un pedido vendido actualiza `estadoPedido` de su venta y reconsolida el día.
    Toda venta nace `Finalizado`; una venta `Cancelado` no cuenta en ningún indicador.
14. **Indicadores consolidados.** `indicadores_diarios` es un dato **derivado**: un documento por día
    con totales y productos. Se recalcula al crear, editar (los dos días si cambia la fecha) o eliminar
    una venta. Nunca se edita a mano; `POST /api/indicators/rebuild` lo regenera completo y convierte a
    `Date` las ventas antiguas que tenían `fecha` como texto.
15. **Valoraciones.** La nota (`calificacion`) es del ticket y se atribuye a cada producto distinto de
    esa venta. Solo cuentan los comentarios con `status: true`.
16. **Visibilidad (`status`).** Solo cambia por `PATCH /:id/status`; el `PATCH` general la ignora.
    Los documentos anteriores a la bandera no tienen el campo y cuentan como visibles (`{ $ne: false }`).
17. **Borrados protegidos.** Un pedido con venta no se elimina (409). Eliminar la venta de un pedido
    `Finalizado` lo devuelve a `Listo` (si no, quedaría finalizado sin venta y bloqueado). Una categoría sí, y deja a sus
    productos con `category` huérfano: preferir `status: false`.

### Sesión
18. **El token no se puede revocar** antes de sus 2 horas de vida. Las únicas formas de cortar el acceso
    al instante son `status: false` o eliminar el usuario (el middleware consulta la BD). Cerrar sesión
    es borrar el token en el cliente.
19. **Rotar `JWT_SECRET` invalida todos los tokens emitidos** (todos deben volver a iniciar sesión).

### Pruebas
20. `npm test` usa `mongodb-memory-server`: la primera vez descarga un binario de `mongod` a la caché
    del usuario (requiere internet); después funciona sin conexión. Nunca toca Atlas.

---

## 5. Ticket y QR

### Qué es cada cosa
| Campo (venta) | Tipo | Quién lo ve | Para qué |
|---|---|---|---|
| `_id` | ObjectId | API | Rutas `/api/sales/:id`. |
| `saleId` | 1, 2, 3… | Personal | Número interno de la venta (caja, reportes). |
| `ticketId` | 1, 2, 3… | Cliente | Número impreso en el ticket ("Ticket N° 42"). |
| `qr` | `QR-` + 16 hex | Cliente (dentro del QR) | **Llave de un solo uso para comentar.** |
| `orderId` | ObjectId o ausente | API | Pedido vendido. Ausente en una venta directa. |

- **Ticket ≠ QR.** El ticket es el registro impreso de la venta; el QR es un dibujo impreso en él que lleva el
  enlace `<frontend>/calificar/<qr>`.
- **Por qué `qr` no es `ticketId`.** Un número consecutivo se adivina (si tengo el ticket 42, pruebo
  el 41). El `qr` sale de `crypto.randomBytes(8)` (64 bits): no se puede deducir de ningún otro dato.
- **Por qué dos consecutivos.** `saleId` identifica la venta y `ticketId` el ticket. Hoy avanzan
  juntos, pero tienen secuencias separadas (`sales`, `tickets`) para que la numeración de los tickets
  pueda cambiar (otra serie, reimpresión) sin tocar la de ventas.

### Ciclo
```
POST /api/sales ─▶ pre('save'): saleId = $inc('sales') y ticketId = $inc('tickets') a la vez, qr = aleatorio
      │             (lo que venga en el body para estos campos se descarta; son immutable)
      ▼
Frontend dibuja el QR con el enlace /calificar/<qr>  (la imagen no se guarda: se genera al imprimir)
      │
      ▼
Cliente escanea ─▶ POST /api/comments { codigo: <qr> }
                     │  (venta y comentario se buscan a la vez; se revisan en este orden)
                     ├─ ¿existe una venta con ese qr?          no → 404
                     ├─ ¿ya hay un comentario con ese codigo?  sí → 400
                     └─ guarda el comentario con venta = sale._id
```

### Reglas
- **Secreto.** `qr` solo sale por rutas de personal (`/api/sales`) y nunca en
  `GET /api/comments/public`. Quien tenga el código puede publicar un comentario.
- **Imagen del QR.** Se genera en el Frontend con una librería local (p. ej. `qrcode.react`).
  No usar servicios externos (`api.qrserver.com`): verían cada código.
- **Inmutables.** `saleId`, `ticketId`, `qr` y `orderId` no cambian después de crear la venta (`immutable`
  en el Schema: Mongoose ignora el cambio sin error).
- **Sin huecos por validación.** Los números se asignan en `pre('save')`, que corre después de validar:
  una venta rechazada no consume número. Sí quedan huecos si se **elimina** una venta (su número no se
  reutiliza) o si la escritura falla en la BD (p. ej. dos cajas vendiendo el mismo pedido).
- **`orderId` opcional y único.** Índice único **parcial** (`$type: 'objectId'`): un pedido se vende una
  vez, y las ventas directas (sin pedido) no chocan entre sí por compartir `null`.
- **`insertMany` no ejecuta `pre('save')`**: cualquier carga masiva debe asignar los números (ver la migración).

### Migración (`npm run migrate`)
Las bases anteriores guardaban `numeroPedido`, `idVenta` e `idTicketVenta` (texto) y `pedidoAsociado`.
`src/migrations/sale-identifiers.migration.js`:
1. Elimina los índices únicos antiguos **antes** de renombrar (si no, al quitar el campo todos los
   documentos valdrían `null` en ese índice y el renombrado fallaría por duplicado).
2. `idTicketVenta` → `qr`: los tickets ya impresos y sus comentarios siguen funcionando.
3. `pedidoAsociado` → `orderId`; `idVenta` y `numeroPedido` se conservan en `legacy.*`.
4. Numera pedidos y ventas sin número en orden de creación (`_id`) y sube los contadores.
5. Crea los índices nuevos.

Es idempotente. **Correrla una vez sobre Atlas antes de usar esta versión**: mientras existan los índices
`idVenta_1` / `idTicketVenta_1`, la segunda venta nueva falla con 11000 (ambas valen `null` ahí).

---

## 6. Decisiones técnicas clave

Decisiones que explican por qué el código tiene esta forma. Las cuatro últimas son de la última
refactorización.

| Decisión | Por qué |
|---|---|
| `app.js` (armar) separado de `index.js` (arrancar) | Las pruebas levantan la API completa sin abrir el puerto real ni conectar a Atlas. |
| Errores centralizados: `HttpError` + `asyncHandler` + `errorHandler` | Ningún controlador repite `try/catch` ni decide códigos de error: lanza y sigue. Un solo lugar define cómo se ve un error. |
| El servidor calcula precios, subtotales, totales y consecutivos | Lo que envía el cliente no es de fiar; un total mal calculado en el navegador acabaría en los indicadores. |
| Indicadores consolidados por día (`indicadores_diarios`) | El dashboard lee como mucho un documento por día en vez de recorrer todas las ventas. Se **recalcula**, no se incrementa: es idempotente. |
| Roles leídos del enum del modelo `User` | Una sola fuente de verdad; si falta un rol, el servidor no arranca. |
| Fábricas `createCrudService` / `createCrudController` | Establecimiento, horarios y ubicaciones son CRUD puros: comparten una implementación en vez de tres copias. |
| **`rejectMongoOperators` global** (`middlewares/body.middleware.js`) | Un Cliente podía volverse Owner con `PATCH /api/users/:id { "$set": { "role": "Owner" } }`, o guardar una contraseña sin hash. Se corta en un punto para toda la API (sección 1.5). |
| **`ensureBody` salió de `error.middleware.js`** a `body.middleware.js` | Preparar el body no es manejar errores: cada archivo de middleware queda con una sola responsabilidad. |
| **Sufijo de helpers unificado** (`bcrypt.helper.js`, `jwt.helper.js`) | Convivían `.helper.js` y `.helpers.js`; ahora el nombre del archivo predice la capa sin excepciones. |
| **`handleMongooseError` exige `keyValue`** en el error 11000 | Un duplicado dentro de un `bulkWrite` no lo trae, y leerlo lanzaba un `TypeError` dentro del propio manejador de errores. |
| **`ARQUITECTURA.md` visible y `README.md` nuevo** | La guía estaba oculta como `.ARQUITECTURA.md` y no había instrucciones de instalación. |

### Implementados después

| Cambio | Cómo |
|---|---|
| **"Me gusta" de comentarios** | `POST / DELETE /api/comments/:id/like` (Owner, Administrador y Cliente). `dbLikeComment` / `dbUnlikeComment` cambian `likedBy` y `likes` en UNA operación atómica, filtrando por si la persona ya estaba: repetir no suma ni resta. `GET /api/comments/public` devuelve `likedByMe` y nunca `likedBy`. |
| **Mis PQRS** | `GET /api/pqrs/mine` (solo Cliente, declarada antes de `/:id`). El usuario sale del token; no incluye `respondedBy`. |
| **Respuesta de PQRS** | Campos `respuesta` (10-1000 caracteres), `respondedBy` y `respondedAt`. Listas blancas: el Cliente solo envía `tipo, asunto, descripcion`; la administración solo `estado, respuesta`, y el servidor registra quién respondió y cuándo. |
| **Recetas** (módulo `recipes`) | Modelo `Recipe` (colección `recetas`): `product` (único, inmutable) e `items: [{ supply, quantity }]`. CRUD para `ADMIN_ROLES`, lectura para `STAFF_ROLES`. Un combo no lleva receta. Al eliminar un producto, su receta se va con él. |
| **Inventario al vender** | `recipes.services.js`: `dbGetSuppliesUsage` (receta × unidades; un combo se cambia por sus productos), `dbAssertSuppliesAvailable` (409 `missingSupplies` antes de vender; devuelve el consumo para reutilizarlo), `dbDiscountSupplies` (restas atómicas con filtro `stock >= cantidad`, lanzadas a la vez; si una falla se devuelven las demás: todo o nada) y `dbReturnSupplies` (sumas a la vez). La venta guarda `suppliesUsed` y eso es lo que vuelve al inventario al eliminarla o al cancelar su pedido (una sola vez). |
| **Combos** | Producto con `comboItems: [{ product, quantity }]` y `comboPriceMode` (`sum` / `custom`). `prepareCombo` (products.services) valida: productos existentes, sin combos dentro de combos, sin receta propia. En modo `sum` el precio es la suma de sus productos y `dbRefreshComboPrices` lo recalcula cuando cambia el precio de uno. Un producto que está en un combo no se elimina (409). |
| **Quitar productos de un pedido** | `PUT /api/orders/:id/items` (`dbReplaceOrderItems`): reemplaza la lista completa mientras el pedido esté abierto; los que ya estaban conservan su precio. |
| **Stock mínimo de insumos** | Campo `minStock` (≥ 0, por defecto 0) en el modelo `Supply`: Inventario marca "Stock bajo" cuando el stock llega a ese valor. |
| **Estrellas por producto** | `GET /api/products/public` añade `rating: { score, count }` con `dbGetProductReviews` (el mismo cálculo de reseñas de Indicadores; su `limit` ahora es opcional). |
| **Optimización de consultas** (nov. 2026) | Las consultas independientes de las escrituras van en `Promise.all` y se quitaron las repetidas (sección 3, "Paralelismo"). Con ~100 ms de latencia por consulta: vender un pedido 2,9 s → 1,6 s, venta directa 2,5 s → 1,5 s, cancelar un pedido vendido o eliminar una venta ~40 % menos. Rutas, parámetros y respuestas no cambiaron. |

### Pendientes conocidos (anotados, no implementados)

- **Baja lógica de usuarios:** el modelo ya tiene `deletedAt` y `deletedBy` y existe
  `OWNER_MANAGEABLE_ROLES`, pero `DELETE /api/users/:id` todavía borra el documento.
- **`calificacion` (1–5)** convive con `valoracion` (1–10): Indicadores aún promedia la primera.
- **Puerto por defecto:** sin `PORT`, `index.js` usa 3001, mientras `.env.example` y Bruno usan 3000.
