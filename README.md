# Eco Ticket Backend

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/REST-API-FF6B6B?style=for-the-badge" alt="REST API" />
</div>

<p align="center">
  <strong>Backend para gestionar eventos de Eco Ticket</strong>
</p>

Este proyecto es un backend desarrollado en Node.js para manejar eventos de la aplicación Eco Ticket. La API permite crear, listar, consultar, actualizar y eliminar eventos usando PostgreSQL como base de datos.

La idea de este README es explicarte de forma educativa cómo se construyó este backend, qué hace cada archivo y cómo levantar el servidor para probarlo paso a paso.

---

## 1. ¿Qué tecnologías se usan?

Este backend está compuesto por:

- Node.js: entorno de ejecución del servidor.
- PostgreSQL: base de datos relacional para guardar los eventos.
- pg: librería de Node para conectarse a PostgreSQL.
- HTTP nativo de Node: el servidor se crea sin framework con `http.createServer()`.

---

## 2. Estructura del proyecto

```text
backend/
├── database/
│   └── schemas.sql
├── db.js
├── server.js
├── package.json
├── pnpm-lock.yaml
└── README.md
```

### Archivos principales

#### `db.js`
Este archivo se encarga de crear la conexión con PostgreSQL.

#### `server.js`
Aquí se define el servidor HTTP, las rutas y la lógica del CRUD.

#### `database/schemas.sql`
Aquí está la estructura de la tabla `events` y algunos datos de ejemplo.

---

## 3. Preparación inicial

Antes de correr el backend debes tener instalado:

- Node.js
- pnpm
- PostgreSQL

### 3.1 Crear la base de datos

En PostgreSQL crea una base de datos llamada `eco_ticket`:

```sql
CREATE DATABASE eco_ticket;
```

### 3.2 Ejecutar el schema

Abre el archivo `database/schemas.sql` y ejecútalo en tu PostgreSQL para crear la tabla `events` y algunos datos iniciales.

Ejemplo:

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    location VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Luego inserta algunos eventos de ejemplo:

```sql
INSERT INTO events (name, description, date, location, price, image)
VALUES (
  'Rock Ecológico',
  'Festival de rock comprometido con el medio ambiente.',
  '2026-10-15',
  'Tuluá',
  15.00,
  'rock-ecologico.jpg'
);
```

---

## 4. Cómo funciona la conexión a PostgreSQL

Archivo: `db.js`

```js
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'eco_ticket',
    password: 'sefogi',
    port: 5432,
});

export default pool;
```

### ¿Qué significa cada parte?

- `pg`: importa la librería para PostgreSQL.
- `Pool`: permite reutilizar conexiones a la base de datos.
- `user: 'postgres'`: usuario de PostgreSQL.
- `host: 'localhost'`: la base está en tu máquina local.
- `database: 'eco_ticket'`: nombre de la base de datos.
- `password: 'sefogi'`: contraseña de PostgreSQL.
- `port: 5432`: puerto estándar de PostgreSQL.

> Si tu usuario o contraseña no son iguales, debes cambiarlos aquí.

---

## 5. Cómo se levanta el servidor

### 5.1 Instalar dependencias

Desde la raíz del proyecto:

```bash
pnpm install
```

### 5.2 Iniciar el servidor

```bash
pnpm run start
```

Esto ejecuta lo siguiente:

```bash
node server.js
```

Si todo va bien, verás este mensaje:

```bash
Servidor ejecutándose en http://localhost:3000
```

### 5.3 Si falla por puerto ocupado

Es común ver este error:

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

Esto significa que otro proceso ya está usando el puerto `3000`.

#### Soluciones

1. Cierra la otra aplicación que esté ocupando ese puerto.
2. O cambia el puerto en `server.js`.

Ejemplo:

```js
const PORT = 4000;
```

Y luego accedes a:

```bash
http://localhost:4000
```

---

## 6. Explicación del archivo `server.js`

Este es el archivo más importante porque aquí se construye el servidor y se definen todas las rutas del API.

### 6.1 Creación del servidor

```js
import http from "http";
import pool from "./db.js";

const PORT = 3000;
```

- `http`: módulo nativo para crear un servidor HTTP.
- `pool`: la conexión a PostgreSQL.
- `PORT`: el puerto donde correrá la API.

---

### 6.2 Función para leer el body de la petición

```js
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            if (!body) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });

        req.on("error", reject);
    });
}
```

#### ¿Qué hace?

Cuando llega una petición `POST` o `PUT`, el cliente normalmente envía JSON en el cuerpo. Esta función:

- escucha los datos que llegan,
- los junta,
- intenta convertirlos a JSON,
- devuelve un objeto JavaScript para usarlo fácilmente.

---

### 6.3 Función para responder JSON

```js
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}
```

Esto hace que todas las respuestas sean JSON, que es el formato estándar de una API REST.

---

### 6.4 Ruta principal: `/events`

```js
const server = http.createServer(async (req, res) => {

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts[0] === "events") {
```

#### ¿Qué hace?

- `req.url` obtiene la URL solicitada.
- `new URL(...)` convierte la ruta en un objeto útil.
- `pathParts` separa la ruta por barras.
- Si la primera parte es `events`, la API entra en la lógica del CRUD.

Ejemplos:

- `/events` → todos los eventos
- `/events/1` → un evento específico

---

## 7. CRUD explicado paso a paso

### 7.1 GET /events

```js
if (req.method === "GET" && !id) {
    const result = await pool.query(
        "SELECT * FROM events ORDER BY id ASC"
    );
    return sendJSON(res, 200, result.rows);
}
```

#### ¿Qué hace?

Consulta todos los eventos y los devuelve en JSON.

#### Ejemplo:

```bash
curl http://localhost:3000/events
```

---

### 7.2 GET /events/:id

```js
if (req.method === "GET" && id) {
    const result = await pool.query(
        "SELECT * FROM events WHERE id = $1",
        [id]
    );

    if (result.rows.length === 0) {
        return sendJSON(res, 404, { error: "Evento no encontrado" });
    }

    return sendJSON(res, 200, result.rows[0]);
}
```

#### ¿Qué hace?

Busca un evento por su `id`.

#### Ejemplo:

```bash
curl http://localhost:3000/events/1
```

---

### 7.3 POST /events

```js
if (req.method === "POST" && !id) {
    const body = await getRequestBody(req);
    const { name, description, date, location, price, image } = body;

    if (!name || !date || !location) {
        return sendJSON(res, 400, {
            error: "Los campos 'name', 'date' y 'location' son obligatorios"
        });
    }

    const result = await pool.query(
        `INSERT INTO events (name, description, date, location, price, image)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, description || null, date, location, price || 0, image || null]
    );

    return sendJSON(res, 201, result.rows[0]);
}
```

#### ¿Qué hace?

Recibe los datos del nuevo evento y los guarda en PostgreSQL.

#### Campos obligatorios

- `name`
- `date`
- `location`

#### Ejemplo de petición:

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Festival Verde",
    "description": "Festival comunitario con actividades ecológicas",
    "date": "2026-12-20",
    "location": "Bogotá",
    "price": 25,
    "image": "festival-verde.jpg"
  }'
```

#### Respuesta esperada:

```json
{
  "id": 3,
  "name": "Festival Verde",
  "description": "Festival comunitario con actividades ecológicas",
  "date": "2026-12-20",
  "location": "Bogotá",
  "price": "25",
  "image": "festival-verde.jpg",
  "created_at": "2026-09-11T12:00:00.000Z"
}
```

---

### 7.4 PUT /events/:id

```js
if (req.method === "PUT" && id) {
    const body = await getRequestBody(req);
    const { name, description, date, location, price, image } = body;

    const existing = await pool.query(
        "SELECT * FROM events WHERE id = $1",
        [id]
    );

    if (existing.rows.length === 0) {
        return sendJSON(res, 404, { error: "Evento no encontrado" });
    }

    const current = existing.rows[0];

    const result = await pool.query(
        `UPDATE events
         SET name = $1,
             description = $2,
             date = $3,
             location = $4,
             price = $5,
             image = $6
         WHERE id = $7
         RETURNING *`,
        [
            name ?? current.name,
            description ?? current.description,
            date ?? current.date,
            location ?? current.location,
            price ?? current.price,
            image ?? current.image,
            id
        ]
    );

    return sendJSON(res, 200, result.rows[0]);
}
```

#### ¿Qué hace?

Actualiza un evento existente sin perder datos si no se envían todos los campos.

Usa `??` para conservar el valor actual si el nuevo viene vacío o `undefined`.

#### Ejemplo:

```bash
curl -X PUT http://localhost:3000/events/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rock Ecológico Actualizado",
    "price": 30
  }'
```

---

### 7.5 DELETE /events/:id

```js
if (req.method === "DELETE" && id) {
    const result = await pool.query(
        "DELETE FROM events WHERE id = $1 RETURNING *",
        [id]
    );

    if (result.rows.length === 0) {
        return sendJSON(res, 404, { error: "Evento no encontrado" });
    }

    return sendJSON(res, 200, {
        message: "Evento eliminado correctamente",
        event: result.rows[0]
    });
}
```

#### ¿Qué hace?

Elimina un evento por su `id`.

#### Ejemplo:

```bash
curl -X DELETE http://localhost:3000/events/1
```

---

## 8. Cómo probar el backend con Postman o curl

### Opción 1: curl

#### Ver todos:

```bash
curl http://localhost:3000/events
```

#### Ver uno:

```bash
curl http://localhost:3000/events/1
```

#### Crear:

```bash
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d '{"name":"Nuevo evento","date":"2026-12-01","location":"Cali"}'
```

#### Actualizar:

```bash
curl -X PUT http://localhost:3000/events/1 -H "Content-Type: application/json" -d '{"price": 50}'
```

#### Eliminar:

```bash
curl -X DELETE http://localhost:3000/events/1
```

### Opción 2: Postman

1. Crea una nueva request.
2. Selecciona el método `GET`, `POST`, `PUT` o `DELETE`.
3. Usa la URL `http://localhost:3000/events` o `http://localhost:3000/events/1`.
4. En el body, usa `raw` y selecciona `JSON`.
5. Envía la petición.

---

## 9. Manejo de errores

El servidor responde con distintos códigos HTTP:

- `200` → éxito
- `201` → recurso creado
- `400` → datos faltantes o inválidos
- `404` → recurso no encontrado
- `405` → método no permitido
- `500` → error del servidor

### Ejemplo de error 400

Si envías un `POST` sin `name`, `date` o `location`, recibirás algo como:

```json
{
  "error": "Los campos 'name', 'date' y 'location' son obligatorios"
}
```

---

## 10. Entendiendo la lógica general

El backend sigue un patrón típico de API REST:

- `GET` → leer
- `POST` → crear
- `PUT` → actualizar
- `DELETE` → borrar

La lógica central está en el servidor; cada ruta decide qué hacer según:

- la URL
- el método HTTP
- el ID del recurso
- la información enviada en el body

Esto se hace sin usar un framework, solo con Node.js y PostgreSQL.

---

## 11. Recomendaciones para seguir aprendiendo

1. Agrega validaciones más estrictas para los eventos.
2. Crea rutas para usuarios, tickets o categorías.
3. Implementa `Express` para hacer el código más limpio y escalable.
4. Añade autenticación.
5. Genera documentación con Swagger o OpenAPI.

---

## 12. Resumen final

Este backend funciona así:

1. Se conecta a PostgreSQL con `pg`.
2. El servidor escucha peticiones HTTP en el puerto `3000`.
3. Las rutas `/events` y `/events/:id` manejan el CRUD.
4. Las consultas SQL se ejecutan con `pool.query()`.
5. El servidor responde siempre en JSON.

Con esto puedes crear una API simple, funcional y educativa para gestionar eventos de Eco Ticket.

---

## 13. Comandos útiles

```bash
pnpm install
pnpm run start
curl http://localhost:3000/events
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d '{"name":"Prueba","date":"2026-10-10","location":"Tulua"}'
```

---

<p align="center">
  <strong>Hecho para aprender y continuar construyendo Eco Ticket 🚀</strong>
</p>

---

## 4. Cómo funciona la conexión a PostgreSQL

Archivo: `db.js`

```js
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'eco_ticket',
    password: 'sefogi',
    port: 5432,
});

export default pool;
```

### Explicación

- `pg` importa la librería para PostgreSQL.
- `Pool` permite crear un conjunto de conexiones reutilizables.
- `user: 'postgres'` indica el usuario de la base de datos.
- `host: 'localhost'` significa que la base está en tu máquina local.
- `database: 'eco_ticket'` es la base que creamos.
- `password: 'sefogi'` es la contraseña de PostgreSQL.
- `port: 5432` es el puerto estándar de PostgreSQL.

> Importante: si tu usuario o contraseña de PostgreSQL son diferentes, debes cambiarlos aquí.

---

## 5. Cómo se levanta el servidor

### 5.1 Instalar dependencias

Desde la raíz del proyecto:

```bash
pnpm install
```

### 5.2 Iniciar el servidor

```bash
pnpm run start
```

Si el proyecto tiene el script correctamente configurado, esto ejecuta:

```bash
node server.js
```

Luego debería aparecer algo así:

```bash
Servidor ejecutándose en http://localhost:3000
```

### 5.3 Si falla por puerto ocupado

Es muy común ver este error:

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

Esto significa que el puerto `3000` ya está en uso por otra aplicación.

#### Soluciones:

1. Cierra la otra app que usa el puerto 3000.
2. O cambia el puerto en `server.js`.

Ejemplo:

```js
const PORT = 4000;
```

Y luego accede a:

```bash
http://localhost:4000
```

---

## 6. Explicación del archivo `server.js`

Este archivo es el corazón de la API. Aquí se define cómo responde el servidor a cada ruta.

### 6.1 Creación del servidor

```js
import http from "http";
import pool from "./db.js";

const PORT = 3000;
```

- `http` permite crear un servidor HTTP sin frameworks.
- `pool` es la conexión a PostgreSQL.
- `PORT` es el puerto en donde corre la API.

---

### 6.2 Función para leer el body de la petición

```js
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            if (!body) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });

        req.on("error", reject);
    });
}
```

#### ¿Qué hace?

Cuando llega una petición `POST` o `PUT`, el cliente suele enviar JSON en el cuerpo. Esta función:

- escucha los datos que llegan,
- los junta en un string,
- intenta convertirlos a JSON,
- devuelve un objeto JavaScript útil para trabajar.

---

### 6.3 Función para responder JSON

```js
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}
```

Esto hace que todas las respuestas del backend salgan como JSON, lo cual es estándar para APIs REST.

---

### 6.4 Ruta principal: `/events`

```js
const server = http.createServer(async (req, res) => {

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts[0] === "events") {
```

#### ¿Qué hace?

- `req.url` es la ruta solicitada.
- `new URL(...)` convierte la ruta en un objeto manejable.
- `pathParts` separa la URL en segmentos.
- Si la primera parte es `events`, entra en la lógica del CRUD.

Ejemplos:

- `/events` → lista todos
- `/events/1` → obtiene el evento con id 1

---

## 7. CRUD explicado paso a paso

### 7.1 GET /events

```js
if (req.method === "GET" && !id) {
    const result = await pool.query(
        "SELECT * FROM events ORDER BY id ASC"
    );
    return sendJSON(res, 200, result.rows);
}
```

#### ¿Qué hace?

Consulta todos los eventos en la tabla `events` y los devuelve en formato JSON.

#### Ejemplo con curl:

```bash
curl http://localhost:3000/events
```

---

### 7.2 GET /events/:id

```js
if (req.method === "GET" && id) {
    const result = await pool.query(
        "SELECT * FROM events WHERE id = $1",
        [id]
    );

    if (result.rows.length === 0) {
        return sendJSON(res, 404, { error: "Evento no encontrado" });
    }

    return sendJSON(res, 200, result.rows[0]);
}
```

#### ¿Qué hace?

Busca un evento por su `id`.

#### Ejemplo:

```bash
curl http://localhost:3000/events/1
```

---

### 7.3 POST /events

```js
if (req.method === "POST" && !id) {
    const body = await getRequestBody(req);
    const { name, description, date, location, price, image } = body;

    if (!name || !date || !location) {
        return sendJSON(res, 400, {
            error: "Los campos 'name', 'date' y 'location' son obligatorios"
        });
    }

    const result = await pool.query(
        `INSERT INTO events (name, description, date, location, price, image)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, description || null, date, location, price || 0, image || null]
    );

    return sendJSON(res, 201, result.rows[0]);
}
```

#### ¿Qué hace?

Recibe los datos de un nuevo evento y los guarda en la base de datos.

#### Campos obligatorios

- `name`
- `date`
- `location`

#### Ejemplo de petición:

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Festival Verde",
    "description": "Festival comunitario con actividades ecológicas",
    "date": "2026-12-20",
    "location": "Bogotá",
    "price": 25,
    "image": "festival-verde.jpg"
  }'
```

#### Respuesta esperada

```json
{
  "id": 3,
  "name": "Festival Verde",
  "description": "Festival comunitario con actividades ecológicas",
  "date": "2026-12-20",
  "location": "Bogotá",
  "price": "25",
  "image": "festival-verde.jpg",
  "created_at": "2026-09-11T12:00:00.000Z"
}
```

---

### 7.4 PUT /events/:id

```js
if (req.method === "PUT" && id) {
    const body = await getRequestBody(req);
    const { name, description, date, location, price, image } = body;

    const existing = await pool.query(
        "SELECT * FROM events WHERE id = $1",
        [id]
    );

    if (existing.rows.length === 0) {
        return sendJSON(res, 404, { error: "Evento no encontrado" });
    }

    const current = existing.rows[0];

    const result = await pool.query(
        `UPDATE events
         SET name = $1,
             description = $2,
             date = $3,
             location = $4,
             price = $5,
             image = $6
         WHERE id = $7
         RETURNING *`,
        [
            name ?? current.name,
            description ?? current.description,
            date ?? current.date,
            location ?? current.location,
            price ?? current.price,
            image ?? current.image,
            id
        ]
    );

    return sendJSON(res, 200, result.rows[0]);
}
```

#### ¿Qué hace?

Actualiza un evento existente, pero sin perder campos si no se envían en la petición.

Es decir, usa `??` para conservar el valor anterior si el nuevo valor viene vacío o `undefined`.

#### Ejemplo:

```bash
curl -X PUT http://localhost:3000/events/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rock Ecológico Actualizado",
    "price": 30
  }'
```

---

### 7.5 DELETE /events/:id

```js
if (req.method === "DELETE" && id) {
    const result = await pool.query(
        "DELETE FROM events WHERE id = $1 RETURNING *",
        [id]
    );

    if (result.rows.length === 0) {
        return sendJSON(res, 404, { error: "Evento no encontrado" });
    }

    return sendJSON(res, 200, {
        message: "Evento eliminado correctamente",
        event: result.rows[0]
    });
}
```

#### ¿Qué hace?

Elimina un evento por su `id`.

#### Ejemplo:

```bash
curl -X DELETE http://localhost:3000/events/1
```

---

## 8. Cómo probar el backend con Postman o curl

### Opción 1: curl

#### Ver todos:

```bash
curl http://localhost:3000/events
```

#### Ver uno:

```bash
curl http://localhost:3000/events/1
```

#### Crear:

```bash
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d '{"name":"Nuevo evento","date":"2026-12-01","location":"Cali"}'
```

#### Actualizar:

```bash
curl -X PUT http://localhost:3000/events/1 -H "Content-Type: application/json" -d '{"price": 50}'
```

#### Eliminar:

```bash
curl -X DELETE http://localhost:3000/events/1
```

### Opción 2: Postman

1. Crea una nueva request.
2. Selecciona el método `GET`, `POST`, `PUT` o `DELETE`.
3. Pon la URL como `http://localhost:3000/events` o `http://localhost:3000/events/1`.
4. En `Body`, usa `raw` y selecciona `JSON`.
5. Envía la petición.

---

## 9. Manejo de errores

El servidor responde con distintos códigos HTTP:

- `200` → éxito en consulta o actualización
- `201` → evento creado correctamente
- `400` → datos faltantes o inválidos
- `404` → recurso no encontrado
- `405` → método no permitido
- `500` → error interno del servidor

### Ejemplo de error 400

Si envías un `POST` sin `name`, `date` o `location`, recibes algo como:

```json
{
  "error": "Los campos 'name', 'date' y 'location' son obligatorios"
}
```

---

## 10. Entendiendo la lógica general

El backend sigue un patrón clásico de API REST:

- `GET` → leer
- `POST` → crear
- `PUT` → actualizar
- `DELETE` → borrar

La lógica central está en el servidor; cada ruta decide qué hacer según:

- la URL
- el método HTTP
- el ID del recurso
- la información enviada en el body

Esto lo hace sin usar un framework, usando únicamente Node.js y PostgreSQL.

---

## 11. Recomendaciones para seguir aprendiendo

1. Agrega validaciones más estrictas para el formulario de eventos.
2. Crea rutas separadas para usuarios, tickets o categorías.
3. Implementa `Express` para hacer el código más limpio y escalable.
4. Añade un sistema de autenticación.
5. Crea documentación con Swagger o OpenAPI.

---

## 12. Resumen final

Este backend funciona así:

1. Se conecta a PostgreSQL con `pg`.
2. El servidor escucha peticiones HTTP en el puerto `3000`.
3. Las rutas `/events` y `/events/:id` manejan el CRUD.
4. Las consultas SQL se ejecutan con `pool.query()`.
5. El servidor responde siempre en JSON.

Con esto puedes crear una API robusta, simple y muy didáctica para gestionar eventos de Eco Ticket.

---

## 13. Comandos útiles

```bash
pnpm install
pnpm run start
curl http://localhost:3000/events
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d '{"name":"Prueba","date":"2026-10-10","location":"Tulua"}'
```

Si quieres, en el siguiente paso puedo ayudarte a crear un README más visual con imágenes, diagrama de flujo y ejemplos de Postman para cada endpoint.
