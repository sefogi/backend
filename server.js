import http from "http";
import pool from "./db.js";

const PORT = 3000;

// Utilidad para leer el body de la petición (POST/PUT)
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

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === "OPTIONS") {
        res.writeHead(200);
        return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split("/").filter(Boolean); // ej: ["events", "3"]

    // Ruta base: /events
    if (pathParts[0] === "events") {

        const id = pathParts[1]; // undefined si es /events, o el id si es /events/3

        try {

            // GET /events  -> listar todos
            if (req.method === "GET" && !id) {
                const result = await pool.query(
                    "SELECT * FROM events ORDER BY id ASC"
                );
                return sendJSON(res, 200, result.rows);
            }

            // GET /events/:id -> obtener uno
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

            // POST /events -> crear
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
                    [name, description || null, date, location, String(price ?? "0.00"), image || null]
                );

                return sendJSON(res, 201, result.rows[0]);
            }

            // PUT /events/:id -> actualizar
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
                        String(price ?? current.price ?? "0.00"),
                        image ?? current.image,
                        id
                    ]
                );

                return sendJSON(res, 200, result.rows[0]);
            }

            // DELETE /events/:id -> eliminar
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

            // Método no soportado sobre /events
            return sendJSON(res, 405, { error: "Método no permitido" });

        } catch (error) {
            console.error(error);
            return sendJSON(res, 500, {
                message: "Error en el servidor",
                error: error.message
            });
        }
    }

    // Cualquier otra ruta
    sendJSON(res, 404, { error: "Ruta no encontrada" });
});

server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});