// Creación de un servidor HTTP básico en Node.js
// Para arrancar el servidor y que se refresque cambios en el servidor en caliente arrancar con node --watch server.js
import { createServer } from "node:http";
import { json } from "node:stream/consumers";
// Libreria para crear un id random único para cada jugador
import { randomUUID } from "node:crypto";
//Con esta instruccion cargamos las variables de entorno definidad en .env
process.loadEnvFile();

// Podemos poner un puerto fijo a piñon o podemos poner 0 para que el sistema operativo nos asigne un puerto libre automáticamente. o se puede usar una variable de entorno para definir el puerto, por ejemplo PORT=3000 node server.js
const port = process.env.PORT ?? 0;

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

const players = []

const server = createServer(async(req, res) => {
  const { method, url } = req;
  console.log(`Request received: ${method} ${url}`);
  //Tengo que separar la ruta de la query string porque en url esta toda completa
  const [pathname, queryString] = url.split("?");
  
  //Obtenemos los parámetros de la query string en un objeto para poder acceder a ellos fácilmente
  const searchParams = new URLSearchParams(queryString);
  console.log("Search params:", Object.fromEntries(searchParams.entries()));

  if(method === "GET") {
    if (pathname === "/") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Hello, World desde nodeJs 📁! \n");
    } else if (pathname === "/health") {
        sendJson(res, 200, {
        status: "ok",
        uptime: process.uptime(), // tiempo de actividad del proceso en segundos
        os: process.platform,
        arch: process.arch,
        nodeVersion: process.version
        });
    } else if (pathname === "/players") {
        // Creacion de una paginación simple para la lista de jugadores, con limit y offset a partir de los query params
        const limit = parseInt(searchParams.get("limit")) || 10;
        const offset = parseInt(searchParams.get("offset")) || 0;
        const paginatedPlayers = players.slice(offset, offset + limit);
        
        sendJson(res, 200, {
        players: paginatedPlayers
     });
    } else {
        sendJson(res, 404, {
        error: "Not Found"
        });
    }
  } else if (method === "POST") {
    if (pathname === "/createPlayer") {
        const body = await json(req);
        console.log("Received body:", body);
        if (!body.name || !body.position) {
            return sendJson(res, 400, {
                error: "Missing required fields: name and position",
            });
        }


        const player = {
            id: randomUUID(),
            name: body.name,
            position: body.position,
            number: body.number || null,
        };

        players.push(player);

        return sendJson(res, 200, {
            message: "Jugador creado correctamente",
        });
    }
  }
});

server.listen(port, () => {
  // Con server.address() obtenemos la dirección y puerto en el que está corriendo el servidor 
  const address = server.address();
  console.log(`Server is running on http://localhost:${address.port}`);
});